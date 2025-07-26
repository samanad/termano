"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, ExternalLink, Key, Globe, Clock } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ApiConnectivityCheck() {
  const [isChecking, setIsChecking] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const checkApiConnectivity = async () => {
    setIsChecking(true)
    try {
      const response = await fetch("/api/check-connectivity")
      const data = await response.json()
      setResults(data)
      setLastChecked(new Date())
    } catch (error) {
      setResults({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      })
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkApiConnectivity()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">BSCScan API Connectivity Check</h1>
          <p className="text-gray-600">Using Etherscan API key to access BSC network data</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Globe className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-600">api.bscscan.com</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                BSCScan API Status
              </CardTitle>
              {results && (
                <div className="flex gap-2">
                  <Badge variant={results.success ? "default" : "destructive"}>
                    {results.success ? "Connected" : "Failed"}
                  </Badge>
                  {results.summary && (
                    <Badge variant="outline">
                      {results.summary.successfulEndpoints}/{results.summary.totalEndpoints} Working
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <CardDescription>
              {lastChecked ? `Last checked: ${lastChecked.toLocaleString()}` : "Checking BSCScan API connectivity..."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Status */}
            <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
              {!results ? (
                <div className="flex flex-col items-center">
                  <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-2" />
                  <p className="text-lg font-medium text-gray-700">Testing BSCScan API...</p>
                  <p className="text-sm text-gray-500 mt-1">Using Etherscan API key</p>
                </div>
              ) : results.success ? (
                <div className="flex flex-col items-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
                  <p className="text-lg font-medium text-green-700">BSCScan API Connected!</p>
                  <p className="text-sm text-gray-600 mt-1">Your Etherscan API key works with BSCScan</p>
                  {results.summary && (
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{results.summary.successfulEndpoints} endpoints working</span>
                      {results.summary.averageResponseTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {results.summary.averageResponseTime}ms avg
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <XCircle className="w-12 h-12 text-red-500 mb-2" />
                  <p className="text-lg font-medium text-red-700">BSCScan API Connection Failed</p>
                  <p className="text-sm text-gray-600 mt-1">Cannot connect to BSCScan API</p>
                  {results.summary && (
                    <p className="text-xs text-gray-500 mt-1">
                      {results.summary.failedEndpoints} of {results.summary.totalEndpoints} endpoints failed
                    </p>
                  )}
                </div>
              )}
            </div>

            <Tabs defaultValue="details">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
                <TabsTrigger value="troubleshooting">Help</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                {results && (
                  <>
                    {/* API Configuration */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-2">
                        <Key className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-blue-800">API Configuration</h3>
                          <div className="mt-2 space-y-1 text-sm text-blue-700">
                            <p>
                              <strong>API Key:</strong>{" "}
                              {results.apiKeyConfigured ? "✅ Configured" : "❌ Not configured"}
                            </p>
                            <p>
                              <strong>Endpoint:</strong> api.bscscan.com
                            </p>
                            <p>
                              <strong>Network:</strong> Binance Smart Chain (BSC)
                            </p>
                            <p>
                              <strong>Environment:</strong> {results.environment}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Performance Summary */}
                    {results.summary && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-green-50 rounded-lg text-center">
                          <div className="text-2xl font-bold text-green-600">{results.summary.successfulEndpoints}</div>
                          <div className="text-xs text-green-700">Working</div>
                        </div>
                        <div className="p-3 bg-red-50 rounded-lg text-center">
                          <div className="text-2xl font-bold text-red-600">{results.summary.failedEndpoints}</div>
                          <div className="text-xs text-red-700">Failed</div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {results.summary.averageResponseTime || "N/A"}
                          </div>
                          <div className="text-xs text-blue-700">Avg Response (ms)</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg text-center">
                          <div className="text-2xl font-bold text-gray-600">{results.summary.totalEndpoints}</div>
                          <div className="text-xs text-gray-700">Total Tests</div>
                        </div>
                      </div>
                    )}

                    {/* Connection Details */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Connection Details</h3>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="font-medium">Status:</div>
                          <div>{results.success ? "✅ Connected" : "❌ Failed"}</div>

                          <div className="font-medium">Best Endpoint:</div>
                          <div>{results.workingEndpoint || "None"}</div>

                          <div className="font-medium">Best Response Time:</div>
                          <div>{results.responseTime ? `${results.responseTime}ms` : "N/A"}</div>

                          <div className="font-medium">Test Address:</div>
                          <div className="font-mono text-xs break-all">{results.testAddress}</div>

                          <div className="font-medium">USDT Contract:</div>
                          <div className="font-mono text-xs break-all">{results.usdtContract}</div>
                        </div>
                      </div>
                    </div>

                    {/* Sample API Response */}
                    {results.apiResponse && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Sample API Response</h3>
                        <div className="p-3 bg-gray-50 rounded-lg max-h-60 overflow-auto">
                          <pre className="text-xs font-mono whitespace-pre-wrap">
                            {JSON.stringify(results.apiResponse, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="endpoints" className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">BSCScan API Endpoints Tested</h3>
                  <div className="space-y-2">
                    {results?.endpoints?.map((endpoint: any, index: number) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          endpoint.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {endpoint.success ? (
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">{endpoint.name}</p>
                              <Badge variant={endpoint.success ? "outline" : "destructive"} className="text-xs">
                                {endpoint.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mt-1 font-mono break-all">{endpoint.url}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs">
                              <span>HTTP: {endpoint.status || "Unknown"}</span>
                              {endpoint.responseTime && <span>Time: {endpoint.responseTime}ms</span>}
                              {endpoint.data?.status && <span>API: {endpoint.data.status}</span>}
                            </div>
                            {endpoint.error && <p className="text-xs text-red-600 mt-1">Error: {endpoint.error}</p>}
                            {endpoint.data?.message && endpoint.data.message !== "OK" && (
                              <p className="text-xs text-orange-600 mt-1">Message: {endpoint.data.message}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="troubleshooting" className="space-y-4">
                {results && !results.success && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-yellow-800">Troubleshooting Steps</h3>
                        <ol className="list-decimal pl-5 mt-2 space-y-2 text-sm text-yellow-700">
                          <li>
                            <strong>Verify API Key:</strong> Ensure your Etherscan API key is correctly set in
                            ETHERSCAN_API_KEY environment variable
                          </li>
                          <li>
                            <strong>Check Network Access:</strong> Verify your environment can make HTTPS requests to
                            api.bscscan.com
                          </li>
                          <li>
                            <strong>Rate Limits:</strong> Etherscan API has rate limits (5 calls/sec for free tier)
                          </li>
                          <li>
                            <strong>API Key Validity:</strong> Ensure your API key is active and not expired
                          </li>
                          <li>
                            <strong>Firewall/Proxy:</strong> Check if corporate firewall or proxy is blocking requests
                          </li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}

                {!results?.apiKeyConfigured && (
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-start gap-2">
                      <Key className="w-5 h-5 text-orange-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-orange-800">API Key Required</h3>
                        <p className="text-sm text-orange-700 mt-1">
                          You need to configure your Etherscan API key to access BSCScan API.
                        </p>
                        <div className="mt-3">
                          <h4 className="font-medium text-orange-800 mb-2">Setup Steps:</h4>
                          <ol className="list-decimal pl-5 space-y-1 text-sm text-orange-700">
                            <li>Your Etherscan API key works for BSCScan too</li>
                            <li>Set ETHERSCAN_API_KEY environment variable</li>
                            <li>Restart your application</li>
                            <li>Test the connectivity again</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Useful Resources</h3>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" asChild className="w-full justify-start bg-transparent">
                      <a href="https://etherscan.io/apis" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Get Etherscan API Key
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="w-full justify-start bg-transparent">
                      <a href="https://docs.bscscan.com/" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        BSCScan API Documentation
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="w-full justify-start bg-transparent">
                      <a
                        href="https://bscscan.com/token/0x55d398326f99059fF775485246999027B3197955"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        USDT BEP20 on BSCScan
                      </a>
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-center">
              <Button onClick={checkApiConnectivity} disabled={isChecking} className="w-full md:w-auto">
                {isChecking ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Test BSCScan API
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
