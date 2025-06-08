"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Key,
  Search,
  Copy,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  Info,
  Gamepad2,
  Shield,
  Download,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface CheatFile {
  id: string
  credits: string
  buildid: string
  description?: string
  titles: string[]
  content: string
}

interface GameData {
  name: string
  titleid: string
  slug: string
  banner?: string
  image?: string
  count: number
  cheats: CheatFile[]
}

type MessageType = "success" | "error" | "info"

export default function CheatSlipsApp() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [titleId, setTitleId] = useState("")
  const [buildId, setBuildId] = useState("")
  const [currentApiToken, setCurrentApiToken] = useState<string | null>(null)
  const [tokenLoading, setTokenLoading] = useState(false)
  const [cheatsLoading, setCheatsLoading] = useState(false)
  const [tokenMessage, setTokenMessage] = useState<{ type: MessageType; text: string } | null>(null)
  const [cheatsMessage, setCheatsMessage] = useState<{ type: MessageType; text: string } | null>(null)
  const [gameData, setGameData] = useState<GameData | null>(null)
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set())
  const [copiedFiles, setCopiedFiles] = useState<Set<string>>(new Set())

  const apiBaseUrlV1 = "https://www.cheatslips.com/api/v1"

  const showTokenMessage = (type: MessageType, text: string) => {
    setTokenMessage({ type, text })
    setTimeout(() => setTokenMessage(null), 5000)
  }

  const showCheatsMessage = (type: MessageType, text: string) => {
    setCheatsMessage({ type, text })
    setTimeout(() => setCheatsMessage(null), 5000)
  }

  const getToken = async () => {
    if (!email.trim() || !password.trim()) {
      showTokenMessage("error", "请输入邮箱和密码")
      return
    }

    setTokenLoading(true)
    setTokenMessage(null)

    try {
      const response = await fetch(`${apiBaseUrlV1}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok && data.token) {
        setCurrentApiToken(data.token)
        showTokenMessage("success", `Token 获取成功！有效期至: ${new Date(data.expiration).toLocaleString()}`)
      } else {
        setCurrentApiToken(null)
        const errorMessage = data.message || data.title || `错误 ${response.status}: ${response.statusText}`
        showTokenMessage("error", `Token 获取失败: ${errorMessage}`)
      }
    } catch (error: any) {
      setCurrentApiToken(null)
      let displayErrorMessage = `请求Token时发生网络错误: ${error.message}`
      if (error.message && error.message.toLowerCase().includes("failed to fetch")) {
        displayErrorMessage += " 这可能由于网络问题或服务器CORS策略。请检查网络并确认API服务器允许跨域请求。"
      }
      showTokenMessage("error", displayErrorMessage)
    } finally {
      setTokenLoading(false)
    }
  }

  const getCheats = async () => {
    if (!currentApiToken) {
      showCheatsMessage("error", "请先获取 API Token")
      return
    }
    if (!titleId.trim()) {
      showCheatsMessage("error", "请输入 TitleId")
      return
    }
    if (!buildId.trim()) {
      showCheatsMessage("error", "请输入 BuildID")
      return
    }

    setCheatsLoading(true)
    setCheatsMessage(null)
    setGameData(null)

    try {
      const requestUrl = `${apiBaseUrlV1}/cheats/${encodeURIComponent(titleId)}/${encodeURIComponent(buildId)}`
      const response = await fetch(requestUrl, {
        method: "GET",
        headers: { Accept: "application/json", "X-API-TOKEN": currentApiToken },
      })

      const data = await response.json()

      if (response.ok) {
        setGameData(data)
        if (data && Array.isArray(data.cheats) && data.cheats.length > 0) {
          showCheatsMessage("success", `成功获取游戏 "${data.name || titleId}" 的 ${data.cheats.length} 个作弊文件`)
        } else if (data && Array.isArray(data.cheats) && data.cheats.length === 0) {
          showCheatsMessage("info", `未找到游戏 "${data.name || titleId}" (BuildID: ${buildId}) 的作弊码`)
        } else {
          showCheatsMessage("error", "收到的作弊码数据格式不正确")
        }
      } else {
        let apiErrorMessage = `错误 ${response.status}: ${response.statusText}`
        if (data && (data.message || data.title || (data.errors && typeof data.errors === "object"))) {
          if (data.message) apiErrorMessage = data.message
          else if (data.title) apiErrorMessage = data.title
          else if (data.errors) {
            try {
              apiErrorMessage = Object.values(data.errors).flat().join("; ")
            } catch (e) {
              apiErrorMessage = JSON.stringify(data.errors)
            }
          }
        }
        showCheatsMessage("error", `获取作弊码失败: ${apiErrorMessage}`)
      }
    } catch (error: any) {
      let displayErrorMessage = `请求作弊码时发生网络错误: ${error.message}`
      if (error.message && error.message.toLowerCase().includes("failed to fetch")) {
        displayErrorMessage += " 这可能由于网络问题或服务器CORS策略。请检查网络并确认API服务器允许跨域请求。"
      }
      showCheatsMessage("error", displayErrorMessage)
    } finally {
      setCheatsLoading(false)
    }
  }

  const toggleFileExpansion = (fileId: string) => {
    const newExpanded = new Set(expandedFiles)
    if (newExpanded.has(fileId)) {
      newExpanded.delete(fileId)
    } else {
      newExpanded.add(fileId)
    }
    setExpandedFiles(newExpanded)
  }

  const copyToClipboard = async (content: string, fileId: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedFiles((prev) => new Set([...prev, fileId]))
      setTimeout(() => {
        setCopiedFiles((prev) => {
          const newSet = new Set(prev)
          newSet.delete(fileId)
          return newSet
        })
      }, 2000)
    } catch (err) {
      console.error("复制失败:", err)
    }
  }

  const MessageAlert = ({ message }: { message: { type: MessageType; text: string } }) => {
    const Icon = message.type === "success" ? CheckCircle : message.type === "error" ? AlertCircle : Info
    return (
      <Alert
        className={cn(
          "mb-4",
          message.type === "success" && "border-green-200 bg-green-50 text-green-800",
          message.type === "error" && "border-red-200 bg-red-50 text-red-800",
          message.type === "info" && "border-blue-200 bg-blue-50 text-blue-800",
        )}
      >
        <Icon className="h-4 w-4" />
        <AlertDescription>{message.text}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Gamepad2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CheatHub
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">现代化的游戏作弊码管理平台</p>
        </div>

        {/* Authentication Section */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-xl">账户认证</CardTitle>
            </div>
            <CardDescription>请输入您的账户信息以获取 API Token</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱地址</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="请输入您的密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={getToken}
                disabled={tokenLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                {tokenLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                ) : (
                  <Key className="h-4 w-4 mr-2" />
                )}
                获取 API Token
              </Button>
            </div>

            {tokenMessage && <MessageAlert message={tokenMessage} />}

            {currentApiToken && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">当前 API Token:</span>
                </div>
                <code className="block p-2 bg-white rounded border text-sm font-mono break-all text-green-700">
                  {currentApiToken}
                </code>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Query Section */}
        {currentApiToken && (
          <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-xl">查询作弊码</CardTitle>
              </div>
              <CardDescription>输入游戏的 TitleId 和 BuildID 来搜索作弊码</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="titleId">TitleId</Label>
                  <Input
                    id="titleId"
                    placeholder="例如: 0100A3D008C5C000"
                    value={titleId}
                    onChange={(e) => setTitleId(e.target.value)}
                    className="font-mono transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buildId">BuildID</Label>
                  <Input
                    id="buildId"
                    placeholder="例如: 421C5411B487EB4D"
                    value={buildId}
                    onChange={(e) => setBuildId(e.target.value)}
                    className="font-mono transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={getCheats}
                  disabled={cheatsLoading}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                >
                  {cheatsLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  获取作弊码
                </Button>
              </div>

              {cheatsMessage && <MessageAlert message={cheatsMessage} />}
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {gameData && (
          <div className="space-y-6">
            {/* Game Info */}
            <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {(gameData.banner || gameData.image) && (
                    <div className="flex-shrink-0">
                      <img
                        src={gameData.banner || gameData.image}
                        alt={`${gameData.name} Banner`}
                        className="w-full md:w-64 h-32 md:h-40 object-cover rounded-lg shadow-md"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-1 space-y-3">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{gameData.name}</h2>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="font-mono">
                        TitleID: {gameData.titleid}
                      </Badge>
                      <Badge variant="outline" className="font-mono">
                        Slug: {gameData.slug}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">总作弊文件数: {gameData.count}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cheat Files */}
            {gameData.cheats && gameData.cheats.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5" />
                  作弊文件列表
                </h3>

                {gameData.cheats.map((cheatFile, index) => (
                  <Card key={cheatFile.id} className="shadow-md border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
                    <Collapsible
                      open={expandedFiles.has(cheatFile.id)}
                      onOpenChange={() => toggleFileExpansion(cheatFile.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="font-mono">
                                #{cheatFile.id}
                              </Badge>
                              <CardTitle className="text-lg">作弊文件 {index + 1}</CardTitle>
                            </div>
                            {expandedFiles.has(cheatFile.id) ? (
                              <ChevronUp className="h-5 w-5 text-gray-500" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-500" />
                            )}
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <CardContent className="pt-0 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-600 dark:text-gray-400">作者:</span>
                              <span className="ml-2">{cheatFile.credits}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600 dark:text-gray-400">BuildID:</span>
                              <code className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                                {cheatFile.buildid}
                              </code>
                            </div>
                          </div>

                          {cheatFile.description && (
                            <div>
                              <span className="font-medium text-gray-600 dark:text-gray-400">描述:</span>
                              <p className="mt-1 text-gray-700 dark:text-gray-300">{cheatFile.description}</p>
                            </div>
                          )}

                          {cheatFile.titles && cheatFile.titles.length > 0 && (
                            <div>
                              <span className="font-medium text-gray-600 dark:text-gray-400">包含的作弊码:</span>
                              <ul className="mt-2 space-y-1">
                                {cheatFile.titles.map((title, idx) => (
                                  <li key={idx} className="flex items-center gap-2 text-sm">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                    {title}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <Separator />

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-600 dark:text-gray-400">作弊码内容:</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(cheatFile.content, cheatFile.id)}
                                className="transition-all duration-200"
                              >
                                {copiedFiles.has(cheatFile.id) ? (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                    已复制
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-4 w-4 mr-2" />
                                    复制
                                  </>
                                )}
                              </Button>
                            </div>
                            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono max-h-80 overflow-y-auto border">
                              <code>{cheatFile.content}</code>
                            </pre>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-muted-foreground">
          <p className="mb-2">CheatHub - 基于 CheatSlips API 的现代化前端应用</p>
          <p>© 2024 CheatHub。请负责任地使用作弊码。</p>
        </footer>
      </div>
    </div>
  )
}
