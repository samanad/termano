import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const etherscanApiKey = process.env.ETHERSCAN_API_KEY || "YourApiKeyHere"
    const usdtContract = "0x55d398326f99059fF775485246999027B3197955"
    const testAddress = "0xa85BAC140e091e5b74c235F666e8C9849a7BBA55"

    console.log("Checking BSCScan API connectivity using Etherscan API key...")
    console.log("API Key configured:", !!etherscanApiKey && etherscanApiKey !== "YourApiKeyHere")

    // Define BSCScan API endpoints using Etherscan API key
    const endpoints = [
      {
        name: "BSCScan - Token Balance",
        url: `https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=${usdtContract}&address=${testAddress}&tag=latest&apikey=${etherscanApiKey}`,
        type: "balance",
      },
      {
        name: "BSCScan - Token Transactions",
        url: `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=${usdtContract}&address=${testAddress}&page=1&offset=5&sort=desc&apikey=${etherscanApiKey}`,
        type: "transactions",
      },
      {
        name: "BSCScan - Account Balance",
        url: `https://api.bscscan.com/api?module=account&action=balance&address=${testAddress}&tag=latest&apikey=${etherscanApiKey}`,
        type: "account",
      },
      {
        name: "BSCScan - API Status Check",
        url: `https://api.bscscan.com/api?module=stats&action=bnbsupply&apikey=${etherscanApiKey}`,
        type: "status",
      },
    ]

    // Test each endpoint
    const endpointResults = []
    let overallSuccess = false
    let workingEndpoint = null
    let apiResponse = null
    let bestResponseTime = Number.POSITIVE_INFINITY

    for (const endpoint of endpoints) {
      try {
        console.log(`Testing endpoint: ${endpoint.name}`)

        const startTime = Date.now()
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

        const response = await fetch(endpoint.url, {
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; BSCScanAPITest/1.0)",
            Accept: "application/json",
            "Accept-Encoding": "gzip, deflate, br",
            Connection: "keep-alive",
          },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        const responseTime = Date.now() - startTime

        console.log(`Response status for ${endpoint.name}: ${response.status}`)

        const responseText = await response.text()
        console.log(`Response preview for ${endpoint.name}:`, responseText.substring(0, 200))

        let responseData
        let parseError = null

        try {
          responseData = JSON.parse(responseText)
        } catch (error) {
          parseError = error instanceof Error ? error.message : "JSON parse failed"
          console.error(`JSON parse error for ${endpoint.name}:`, parseError)
        }

        const isSuccessful = response.ok && responseData && responseData.status === "1"

        const result = {
          name: endpoint.name,
          url: endpoint.url.replace(etherscanApiKey, "***API_KEY***"),
          status: response.status,
          success: isSuccessful,
          responseTime,
          data: responseData,
          type: endpoint.type,
          error: parseError || (!response.ok ? `HTTP ${response.status}` : responseData?.message),
          rawResponse: parseError ? responseText.substring(0, 500) : undefined,
        }

        endpointResults.push(result)

        if (isSuccessful) {
          overallSuccess = true
          if (responseTime < bestResponseTime) {
            bestResponseTime = responseTime
            workingEndpoint = endpoint.name
            apiResponse = responseData
          }
        }

        console.log(`Result for ${endpoint.name}:`, {
          success: isSuccessful,
          responseTime,
          status: response.status,
          apiStatus: responseData?.status,
          message: responseData?.message,
        })
      } catch (error) {
        console.error(`Error testing endpoint ${endpoint.name}:`, error)

        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        let errorType = "Network Error"

        if (errorMessage.includes("aborted")) {
          errorType = "Timeout"
        } else if (errorMessage.includes("fetch failed")) {
          errorType = "Connection Failed"
        } else if (errorMessage.includes("ENOTFOUND")) {
          errorType = "DNS Resolution Failed"
        }

        endpointResults.push({
          name: endpoint.name,
          url: endpoint.url.replace(etherscanApiKey, "***API_KEY***"),
          success: false,
          error: `${errorType}: ${errorMessage}`,
          errorType,
          type: endpoint.type,
        })
      }
    }

    // Determine environment
    let environment = "Unknown"
    if (process.env.VERCEL) {
      environment = "Vercel"
    } else if (process.env.CODESPACE_NAME) {
      environment = "GitHub Codespace"
    } else if (process.env.GITHUB_ACTIONS) {
      environment = "GitHub Actions"
    } else if (process.env.NODE_ENV === "development") {
      environment = "Local Development"
    } else {
      environment = "Node.js Server"
    }

    // Check API key configuration
    const apiKeyConfigured = !!etherscanApiKey && etherscanApiKey !== "YourApiKeyHere"

    // Analyze results
    const successfulEndpoints = endpointResults.filter((e) => e.success)
    const failedEndpoints = endpointResults.filter((e) => !e.success)

    console.log("Final results:", {
      overallSuccess,
      successfulEndpoints: successfulEndpoints.length,
      failedEndpoints: failedEndpoints.length,
      workingEndpoint,
      apiKeyConfigured,
      environment,
    })

    return NextResponse.json({
      success: overallSuccess,
      endpoints: endpointResults,
      workingEndpoint,
      apiResponse,
      apiKeyConfigured,
      environment,
      timestamp: new Date().toISOString(),
      testAddress,
      usdtContract,
      responseTime: bestResponseTime === Number.POSITIVE_INFINITY ? null : bestResponseTime,
      networkInfo: {
        hostname: request.headers.get("host"),
        userAgent: request.headers.get("user-agent"),
        codespace: process.env.CODESPACE_NAME || null,
      },
      apiInfo: {
        baseUrl: "api.bscscan.com",
        documentation: "https://docs.bscscan.com/",
        network: "Binance Smart Chain (BSC)",
        keySource: "Etherscan API Key",
        keyRequired: true,
      },
      summary: {
        totalEndpoints: endpointResults.length,
        successfulEndpoints: successfulEndpoints.length,
        failedEndpoints: failedEndpoints.length,
        averageResponseTime:
          successfulEndpoints.length > 0
            ? Math.round(
                successfulEndpoints.reduce((sum, e) => sum + (e.responseTime || 0), 0) / successfulEndpoints.length,
              )
            : null,
      },
    })
  } catch (error) {
    console.error("Error checking API connectivity:", error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      stack: error instanceof Error ? error.stack : null,
      timestamp: new Date().toISOString(),
      environment: process.env.CODESPACE_NAME ? "GitHub Codespace" : "Unknown",
    })
  }
}
