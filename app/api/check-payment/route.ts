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

    const etherscanApiKey = process.env.BSCSCAN_API_KEY || "YMURRBM3WND7ZIJM8S1C5HEQXQK6W4S45B"
    const usdtContract = "0x55d398326f99059fF775485246999027B3197955"

    console.log("Checking payment for:", {
      address,
      expectedAmount,
      apiKey: etherscanApiKey.substring(0, 8) + "...",
      contract: usdtContract,
    })

    // Check for recent USDT transactions using Etherscan API for BSC
    const apiUrl = `https://api-bsc.etherscan.io/api?module=account&action=tokentx&contractaddress=${usdtContract}&address=${address}&page=1&offset=20&sort=desc&apikey=${etherscanApiKey}`

    console.log("API URL:", apiUrl.replace(etherscanApiKey, "***"))

    const response = await fetch(apiUrl)
    const responseText = await response.text()

    console.log("API Response Status:", response.status)
    console.log("API Response (first 500 chars):", responseText.substring(0, 500))

    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError)
      return NextResponse.json({
        confirmed: false,
        apiStatus: {
          status: "0",
          message: "JSON parse error",
          result: responseText.substring(0, 200),
        },
        debugInfo: {
          error: "Failed to parse API response",
          rawResponse: responseText.substring(0, 1000),
          parseError: parseError instanceof Error ? parseError.message : "Unknown parse error",
        },
      })
    }

    console.log("Parsed API Response:", data)

    let confirmed = false
    let matchingTransactions = []
    let balance = 0

    const apiStatus = {
      status: data.status || "0",
      message: data.message || "Unknown error",
      result: data.result || null,
    }

    if (data.status === "1" && data.result && Array.isArray(data.result)) {
      console.log(`Found ${data.result.length} transactions`)

      // Process transactions
      const processedTxs = data.result.map((tx: any) => {
        const txAmount = Number.parseInt(tx.value) / Math.pow(10, Number.parseInt(tx.tokenDecimal))
        const txTime = new Date(Number.parseInt(tx.timeStamp) * 1000)
        const isRecent = Date.now() - txTime.getTime() < 3600000 // Within last hour
        const isToAddress = tx.to.toLowerCase() === address.toLowerCase()
        const isExpectedAmount = Math.abs(txAmount - Number.parseFloat(expectedAmount)) < 0.001

        return {
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: txAmount,
          timestamp: txTime.toISOString(),
          confirmations: tx.confirmations,
          isRecent,
          isToAddress,
          isExpectedAmount,
          blockNumber: tx.blockNumber,
        }
      })

      // Find matching transactions
      matchingTransactions = processedTxs.filter((tx) => tx.isRecent && tx.isToAddress && tx.isExpectedAmount)

      if (matchingTransactions.length > 0) {
        confirmed = true
        console.log("✅ Found matching transaction:", matchingTransactions[0])
      }

      // Calculate balance (sum of all incoming transactions)
      balance = processedTxs.filter((tx) => tx.isToAddress).reduce((sum, tx) => sum + tx.value, 0)
    }

    // Get current token balance
    try {
      const balanceUrl = `https://api-bsc.etherscan.io/api?module=account&action=tokenbalance&contractaddress=${usdtContract}&address=${address}&tag=latest&apikey=${etherscanApiKey}`
      const balanceResponse = await fetch(balanceUrl)
      const balanceData = await balanceResponse.json()

      if (balanceData.status === "1") {
        const balanceWei = balanceData.result || "0"
        balance = Number.parseInt(balanceWei) / Math.pow(10, 18) // USDT BEP20 has 18 decimals
      }
    } catch (balanceError) {
      console.error("Balance check error:", balanceError)
    }

    const result = {
      confirmed,
      balance,
      transactions: data.result
        ? data.result.slice(0, 10).map((tx: any) => ({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: Number.parseInt(tx.value) / Math.pow(10, Number.parseInt(tx.tokenDecimal)),
            timestamp: new Date(Number.parseInt(tx.timeStamp) * 1000).toISOString(),
            confirmations: tx.confirmations,
          }))
        : [],
      apiStatus,
      debugInfo: {
        apiUrl: apiUrl.replace(etherscanApiKey, "***"),
        requestTime: new Date().toISOString(),
        responseStatus: response.status,
        rawResponse: data,
        matchingTransactions,
        expectedAmount: Number.parseFloat(expectedAmount),
        address,
        usdtContract,
        network: "BSC",
        apiEndpoint: "api-bsc.etherscan.io",
      },
    }

    console.log("Final result:", result)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error checking payment:", error)
    return NextResponse.json({
      confirmed: false,
      balance: 0,
      transactions: [],
      apiStatus: {
        status: "0",
        message: "Request failed",
        result: error instanceof Error ? error.message : "Unknown error",
      },
      debugInfo: {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : null,
        timestamp: new Date().toISOString(),
      },
    })
  }
}
