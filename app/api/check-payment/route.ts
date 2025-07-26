import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const address = searchParams.get("address")
    const expectedAmount = searchParams.get("amount")

    if (!address || !expectedAmount) {
      return NextResponse.json(
        {
          error: "Missing parameters",
          confirmed: false,
          debugInfo: {
            error: "Missing address or amount parameter",
            address,
            expectedAmount,
          },
        },
        { status: 400 },
      )
    }

    const etherscanApiKey = process.env.ETHERSCAN_API_KEY || "YourApiKeyHere"
    const usdtContract = "0x55d398326f99059fF775485246999027B3197955"

    console.log("Checking payment for:", {
      address,
      expectedAmount,
      apiKey: etherscanApiKey.substring(0, 8) + "...",
      contract: usdtContract,
    })

    // BSCScan API endpoint using Etherscan API key
    const apiUrl = `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=${usdtContract}&address=${address}&page=1&offset=20&sort=desc&apikey=${etherscanApiKey}`

    let data = null
    let lastError = null

    try {
      console.log("Fetching from BSCScan API...")

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; PaymentChecker/1.0)",
          Accept: "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const responseText = await response.text()
        console.log("API Response Status:", response.status)
        console.log("API Response (first 200 chars):", responseText.substring(0, 200))

        try {
          data = JSON.parse(responseText)
          console.log("Parsed API Response:", {
            status: data.status,
            message: data.message,
            resultType: typeof data.result,
            resultIsArray: Array.isArray(data.result),
            resultLength: Array.isArray(data.result) ? data.result.length : "N/A",
          })
        } catch (parseError) {
          console.error("JSON Parse Error:", parseError)
          lastError = `JSON parse error: ${parseError instanceof Error ? parseError.message : "Unknown"}`
        }
      } else {
        console.log("❌ HTTP error:", response.status, response.statusText)
        lastError = `HTTP ${response.status}: ${response.statusText}`
      }
    } catch (fetchError) {
      console.error("❌ Fetch error:", fetchError)
      lastError = fetchError instanceof Error ? fetchError.message : "Unknown fetch error"
    }

    // If API call failed, return manual verification mode
    if (!data) {
      console.log("⚠️ API call failed, switching to manual verification mode")

      return NextResponse.json({
        confirmed: false,
        balance: 0,
        transactions: [],
        manualMode: true,
        apiStatus: {
          status: "0",
          message: `API call failed. Error: ${lastError}`,
          result: "Manual verification required",
        },
        debugInfo: {
          error: "API call failed",
          lastError,
          apiUrl: apiUrl.replace(etherscanApiKey, "***"),
          manualVerificationUrl: `https://bscscan.com/token/${usdtContract}?a=${address}`,
          timestamp: new Date().toISOString(),
        },
      })
    }

    let confirmed = false
    let matchingTransactions = []
    let balance = 0
    let processedTransactions = []

    const apiStatus = {
      status: data.status || "0",
      message: data.message || "Unknown error",
      result: data.result || null,
    }

    // Handle successful API response
    if (data.status === "1" && data.result) {
      console.log("✅ API call successful")

      // Check if result is an array (transaction list) or a single value (balance)
      if (Array.isArray(data.result)) {
        console.log(`Found ${data.result.length} transactions`)

        // Process transactions
        processedTransactions = data.result.map((tx: any) => {
          const txAmount = Number.parseInt(tx.value || "0") / Math.pow(10, Number.parseInt(tx.tokenDecimal || "18"))
          const txTime = new Date(Number.parseInt(tx.timeStamp || "0") * 1000)
          const isRecent = Date.now() - txTime.getTime() < 3600000 // Within last hour
          const isToAddress = tx.to && tx.to.toLowerCase() === address.toLowerCase()
          const isExpectedAmount = Math.abs(txAmount - Number.parseFloat(expectedAmount)) < 0.001

          return {
            hash: tx.hash || "",
            from: tx.from || "",
            to: tx.to || "",
            value: txAmount,
            timestamp: txTime.toISOString(),
            confirmations: tx.confirmations || 0,
            isRecent,
            isToAddress,
            isExpectedAmount,
            blockNumber: tx.blockNumber || "",
          }
        })

        // Find matching transactions
        matchingTransactions = processedTransactions.filter(
          (tx) => tx.isRecent && tx.isToAddress && tx.isExpectedAmount,
        )

        if (matchingTransactions.length > 0) {
          confirmed = true
          console.log("✅ Found matching transaction:", matchingTransactions[0])
        }

        // Calculate balance (sum of all incoming transactions)
        balance = processedTransactions.filter((tx) => tx.isToAddress).reduce((sum, tx) => sum + tx.value, 0)
      } else {
        // Handle case where result is not an array (might be a balance or error message)
        console.log("Result is not an array:", typeof data.result, data.result)

        // If it's a string that looks like a number, treat it as balance
        if (typeof data.result === "string" && !isNaN(Number(data.result))) {
          balance = Number.parseInt(data.result) / Math.pow(10, 18) // Assuming 18 decimals
          console.log("Parsed balance:", balance)
        }
      }
    } else {
      console.log("⚠️ API returned status 0 or no result:", data.message)
    }

    const result = {
      confirmed,
      balance,
      transactions: processedTransactions.slice(0, 10), // Return only first 10 transactions
      matchingTransactions,
      apiStatus,
      debugInfo: {
        requestTime: new Date().toISOString(),
        expectedAmount: Number.parseFloat(expectedAmount),
        address,
        usdtContract,
        network: "BSC",
        apiUrl: apiUrl.replace(etherscanApiKey, "***"),
        rawApiResponse: {
          status: data.status,
          message: data.message,
          resultType: typeof data.result,
          resultIsArray: Array.isArray(data.result),
          resultLength: Array.isArray(data.result) ? data.result.length : "N/A",
        },
      },
    }

    console.log("Final result:", {
      confirmed,
      balance,
      transactionCount: processedTransactions.length,
      matchingTransactionCount: matchingTransactions.length,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error checking payment:", error)

    // Enhanced error handling
    let errorMessage = "Unknown error"
    let isNetworkError = false

    if (error instanceof Error) {
      errorMessage = error.message
      isNetworkError =
        error.message.includes("fetch failed") ||
        error.message.includes("ENOTFOUND") ||
        error.message.includes("timeout")
    }

    return NextResponse.json({
      confirmed: false,
      balance: 0,
      transactions: [],
      manualMode: isNetworkError,
      apiStatus: {
        status: "0",
        message: isNetworkError ? "Network connectivity issue" : "Request failed",
        result: errorMessage,
      },
      debugInfo: {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : null,
        timestamp: new Date().toISOString(),
        isNetworkError,
        manualVerificationUrl: `https://bscscan.com/token/0x55d398326f99059fF775485246999027B3197955?a=0xa85BAC140e091e5b74c235F666e8C9849a7BBA55`,
      },
    })
  }
}
