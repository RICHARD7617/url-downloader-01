import { useState } from "react";
import { FaTiktok, FaInstagram, FaFacebook, FaYoutube, FaXTwitter, FaWhatsapp, FaBolt, FaLock, FaCrown, FaDownload } from "react-icons/fa6";
import { useCreateDownload, useGetDownloadStats, getGetDownloadStatsQueryKey, useVerifyAdminPin, useGetAdminDashboard, getGetAdminDashboardQueryKey, useListAdminDownloads } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateDownloadBodyPlatform } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

type Platform = CreateDownloadBodyPlatform;

const platforms: { id: Platform; name: string; icon: React.FC<{ className?: string }>; color: string }[] = [
  { id: "tiktok", name: "TikTok", icon: FaTiktok, color: "text-[#ffffff] dark:text-white" },
  { id: "instagram", name: "Instagram", icon: FaInstagram, color: "text-[#E1306C]" },
  { id: "facebook", name: "Facebook", icon: FaFacebook, color: "text-[#1877F2]" },
  { id: "youtube", name: "YouTube", icon: FaYoutube, color: "text-[#FF0000]" },
  { id: "twitter", name: "X (Twitter)", icon: FaXTwitter, color: "text-[#ffffff] dark:text-white" },
];

export default function Home() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [url, setUrl] = useState("");
  const [progress, setProgress] = useState(0);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [adminPin, setAdminPin] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats } = useGetDownloadStats({
    query: { queryKey: getGetDownloadStatsQueryKey() }
  });

  const createDownload = useCreateDownload({
    mutation: {
      onSuccess: (data) => {
        if (!data.success) {
          toast({
            title: "Download Failed",
            description: "Failed to process the URL. Please try again.",
            variant: "destructive"
          });
          return;
        }
        queryClient.invalidateQueries({ queryKey: getGetDownloadStatsQueryKey() });
        setProgress(100);
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error?.message || "Failed to download video.",
          variant: "destructive"
        });
        setProgress(0);
      }
    }
  });

  const handleDownload = () => {
    if (!url) {
      toast({ title: "URL Required", description: "Please enter a valid video URL." });
      return;
    }
    if (!selectedPlatform) {
      toast({ title: "Platform Required", description: "Please select a platform first." });
      return;
    }

    setProgress(10);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    createDownload.mutate({
      data: { url, platform: selectedPlatform }
    }, {
      onSettled: () => clearInterval(interval)
    });
  };

  const handlePlatformClick = (platform: Platform) => {
    setSelectedPlatform(platform);
    document.getElementById("url-input")?.focus();
  };

  const verifyPin = useVerifyAdminPin({
    mutation: {
      onSuccess: (data) => {
        if (data.valid) {
          setAdminPin(pin);
          toast({ title: "Access Granted", description: "Welcome to the owner panel." });
        } else {
          toast({ title: "Access Denied", description: "Invalid PIN.", variant: "destructive" });
        }
      }
    }
  });

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;
    verifyPin.mutate({ data: { pin } });
  };

  return (
    <div className="animated-bg min-h-[100dvh] w-full text-white flex flex-col relative overflow-hidden dark">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#E1306C]/20 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[50%] translate-x-[-50%] w-[60%] h-[20%] rounded-full bg-[#1877F2]/10 blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="w-full p-6 flex flex-col items-center justify-center space-y-4 pt-16 z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-300">
            SPICE-TECH DOWNLOADER
          </h1>
        </div>
        <p className="text-lg text-muted-foreground font-medium">Download HD Videos Without Watermarks</p>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center w-full max-w-4xl mx-auto px-4 z-10 space-y-12 pb-24">
        
        {/* Stats Bar */}
        <div className="flex gap-8 items-center justify-center text-sm font-medium bg-card/50 backdrop-blur-md px-6 py-3 rounded-full border border-white/5 shadow-xl">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Total Downloads:</span>
            <span className="text-primary font-bold">{stats ? stats.totalDownloads.toLocaleString() : <Skeleton className="w-12 h-4" />}</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Total Users:</span>
            <span className="text-primary font-bold">{stats ? stats.totalUsers.toLocaleString() : <Skeleton className="w-12 h-4" />}</span>
          </div>
        </div>

        {/* Platform Selection */}
        <div className="flex flex-wrap justify-center gap-6 w-full">
          {platforms.map((p) => {
            const Icon = p.icon;
            const isSelected = selectedPlatform === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handlePlatformClick(p.id)}
                className={`group relative flex flex-col items-center gap-3 p-4 rounded-2xl transition-all duration-300
                  ${isSelected ? 'bg-card/80 scale-110 shadow-2xl border-white/10' : 'bg-transparent hover:bg-card/40'}
                  border border-transparent
                `}
                style={isSelected ? { boxShadow: `0 0 30px var(--${p.id})`, borderColor: `var(--${p.id})` } : {}}
              >
                <div 
                  className={`text-5xl transition-all duration-300 ${p.color}`}
                  style={{ color: `var(--${p.id})` }}
                >
                  <Icon className="drop-shadow-[0_0_10px_currentColor]" />
                </div>
                <span className={`text-sm font-semibold transition-colors ${isSelected ? 'text-white' : 'text-muted-foreground group-hover:text-gray-300'}`}>
                  {p.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Input Area */}
        <div className="w-full max-w-2xl space-y-6">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative flex flex-col sm:flex-row gap-4 bg-card/80 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl">
              <Input
                id="url-input"
                type="url"
                placeholder={selectedPlatform ? `Paste ${platforms.find(p => p.id === selectedPlatform)?.name} URL here...` : "Select a platform and paste URL..."}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 h-14 text-lg bg-white/10 border-white/10 focus-visible:ring-primary/50 text-white placeholder:text-gray-400"
              />
              <Button 
                size="lg" 
                className="shiny-btn h-14 px-8 text-lg font-bold bg-gradient-to-r from-purple-700 to-purple-900 text-white shadow-[0_0_24px_rgba(120,40,200,0.55)] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleDownload}
                disabled={createDownload.isPending || !url || !selectedPlatform}
              >
                <FaDownload className="mr-2" /> Download HD
              </Button>
            </div>
          </div>

          {/* Progress & Result */}
          {(createDownload.isPending || createDownload.isSuccess) && (
            <Card className="bg-card/50 backdrop-blur-md border-white/10 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4">
              <CardContent className="p-6">
                {createDownload.isPending && (
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm font-medium text-muted-foreground">
                      <span>Extracting video...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-3 bg-white/5" />
                  </div>
                )}
                
                {createDownload.isSuccess && createDownload.data && createDownload.data.success && (
                  <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                    <div className="w-full sm:w-48 aspect-video rounded-xl overflow-hidden bg-background border border-white/10 relative shrink-0">
                      {createDownload.data.thumbnail ? (
                        <img src={createDownload.data.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl text-muted-foreground">
                          {platforms.find(p => p.id === createDownload.data.platform)?.icon({})}
                        </div>
                      )}
                      {createDownload.data.quality === "HD" && (
                        <Badge className="absolute top-2 right-2 bg-primary/90 text-white font-bold tracking-wider backdrop-blur-sm border-none">HD</Badge>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-4 text-center sm:text-left w-full">
                      <h3 className="font-semibold text-lg text-white line-clamp-2">
                        {createDownload.data.title || `${createDownload.data.platform} Video`}
                      </h3>
                      
                      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                        <Badge variant="secondary" className="bg-white/5 text-gray-300 border-white/10">
                          {createDownload.data.platform}
                        </Badge>
                        <Badge variant="secondary" className="bg-white/5 text-gray-300 border-white/10">
                          {createDownload.data.filename}
                        </Badge>
                      </div>

                      <a 
                        href={createDownload.data.downloadUrl} 
                        download
                        className="inline-flex w-full sm:w-auto mt-4"
                      >
                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 shadow-[0_0_15px_rgba(22,163,74,0.4)]">
                          <FaDownload className="mr-2" /> Save to Device
                        </Button>
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Contact Section */}
        <div className="mt-12 flex flex-col items-center space-y-4">
          <p className="text-muted-foreground font-medium">Need Help?</p>
          <a 
            href="https://wa.me/message/TGJQ4ZZVZ3ZWO1?text=I%20need%20your%20support%20HIS%20EXCELLENCY"
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <Button variant="outline" className="shiny-btn bg-[#25D366] text-white border-[#1aad52] rounded-full px-6 h-12 shadow-[0_4px_20px_rgba(37,211,102,0.4)]">
              <FaWhatsapp className="mr-2 text-xl" /> Contact His Excellency
            </Button>
          </a>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-white/10 bg-black/20 backdrop-blur-md relative z-10">
        <div className="container mx-auto px-4 flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center gap-2 text-white/60 hover:text-white transition-colors cursor-pointer" onClick={() => setIsAdminModalOpen(true)}>
            <FaCrown className="text-primary" />
            <span className="font-medium tracking-wide">Made by His Excellency</span>
          </div>
        </div>
      </footer>

      {/* Admin Lock Button (Subtle) */}
      <button 
        onClick={() => setIsAdminModalOpen(true)}
        className="absolute bottom-4 right-4 p-3 text-muted-foreground/30 hover:text-muted-foreground transition-colors z-20"
      >
        <FaLock />
      </button>

      {/* Admin Modal */}
      <Dialog open={isAdminModalOpen} onOpenChange={setIsAdminModalOpen}>
        <DialogContent className="sm:max-w-[800px] bg-card border-white/10 text-foreground">
          {!adminPin ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FaLock className="text-primary" /> Owner Panel Access
                </DialogTitle>
                <DialogDescription>
                  Enter PIN to access the dashboard.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdminLogin} className="space-y-4 py-4">
                <Input
                  type="password"
                  placeholder="Enter PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="bg-background border-white/10"
                />
                <Button type="submit" className="w-full" disabled={verifyPin.isPending}>
                  {verifyPin.isPending ? "Verifying..." : "Verify PIN"}
                </Button>
              </form>
            </>
          ) : (
            <AdminDashboardView pin={adminPin} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminDashboardView({ pin }: { pin: string }) {
  const { data: dashboard, isLoading } = useGetAdminDashboard(
    { pin },
    { query: { queryKey: getGetAdminDashboardQueryKey({ pin }), enabled: !!pin } }
  );

  const { data: downloads } = useListAdminDownloads(
    { pin, limit: 10 },
    { query: { enabled: !!pin } }
  );

  if (isLoading || !dashboard) {
    return <div className="p-8 flex justify-center"><div className="animate-spin text-4xl text-primary"><FaBolt /></div></div>;
  }

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
      <DialogHeader>
        <DialogTitle className="text-2xl flex items-center gap-2">
          <FaCrown className="text-primary" /> Owner Dashboard
        </DialogTitle>
      </DialogHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-background border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{dashboard.totalUsers.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-background border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Downloads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{dashboard.totalDownloads.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-background border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{dashboard.todayDownloads.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-background border border-white/10">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recent">Recent Downloads</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6 pt-4">
          <Card className="bg-background border-white/10">
            <CardHeader>
              <CardTitle>Daily Downloads (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboard.dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                  <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: 'hsl(var(--primary))' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-background border-white/10">
            <CardHeader>
              <CardTitle>By Platform</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(dashboard.byPlatform).map(([platform, count]) => {
                  const pInfo = platforms.find(p => p.id === platform);
                  const Icon = pInfo?.icon || FaBolt;
                  const percentage = dashboard.totalDownloads > 0 ? (count / dashboard.totalDownloads) * 100 : 0;
                  return (
                    <div key={platform} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Icon className={pInfo?.color} />
                          <span className="capitalize">{platform}</span>
                        </div>
                        <span className="text-muted-foreground">{count} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <Progress value={percentage} className="h-2 bg-white/5" indicatorColor={pInfo?.color ? `var(--${platform})` : undefined} />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="recent" className="pt-4">
          <Card className="bg-background border-white/10">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead>Platform</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {downloads?.downloads.map((d) => (
                    <TableRow key={d.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="capitalize">{d.platform}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">{d.url}</TableCell>
                      <TableCell>{new Date(d.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={d.success ? "default" : "destructive"} className="bg-opacity-20">
                          {d.success ? "Success" : "Failed"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
