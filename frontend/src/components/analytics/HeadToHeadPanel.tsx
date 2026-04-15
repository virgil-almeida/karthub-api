import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { Swords } from "lucide-react";
import { useProfiles } from "@/hooks/useProfiles";
import { useHeadToHead, formatSeconds } from "@/hooks/useAnalyticsData";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

export function HeadToHeadPanel() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: profiles } = useProfiles();
  const [driver1, setDriver1] = useState<string>(user?.id || "");
  const [driver2, setDriver2] = useState<string>("");
  const [selectedHeat, setSelectedHeat] = useState<string>("");
  const { data: h2h, isLoading } = useHeadToHead(driver1 || undefined, driver2 || undefined);

  const otherProfiles = profiles?.filter(p => p.id !== driver1) || [];

  const tooltipStyle = {
    backgroundColor: "hsl(240 10% 6%)",
    border: "1px solid hsl(220 15% 15%)",
    borderRadius: "8px",
    fontFamily: "Orbitron, sans-serif",
    fontSize: "11px",
  };

  return (
    <div className="stat-card">
      <div className="flex items-center gap-2 mb-4">
        <Swords className="w-5 h-5 text-primary" />
        <h2 className="font-racing text-lg font-bold">Head-to-Head</h2>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Select value={driver1} onValueChange={setDriver1}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={t("h2h.driver1")} />
          </SelectTrigger>
          <SelectContent>
            {profiles?.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.full_name || p.username || t("h2h.driver")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground self-center font-racing text-sm">VS</span>
        <Select value={driver2} onValueChange={setDriver2}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={t("h2h.selectOpponent")} />
          </SelectTrigger>
          <SelectContent>
            {otherProfiles.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.full_name || p.username || t("h2h.driver")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="h-40 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && !h2h && driver2 && (
        <div className="h-40 flex flex-col items-center justify-center text-muted-foreground">
          <Swords className="w-10 h-10 mb-2 opacity-50" />
          <p className="text-sm">{t("h2h.noCommonRaces")}</p>
        </div>
      )}

      {!isLoading && !driver2 && (
        <div className="h-40 flex flex-col items-center justify-center text-muted-foreground">
          <Swords className="w-10 h-10 mb-2 opacity-50" />
          <p className="text-sm">{t("h2h.selectOpponentToCompare")}</p>
        </div>
      )}

      {h2h && (
        <Tabs defaultValue="resumo" className="w-full">
          <TabsList className="w-full grid grid-cols-5 mb-4">
            <TabsTrigger value="resumo">{t("h2h.summary")}</TabsTrigger>
            <TabsTrigger value="tmv">{t("h2h.blTime")}</TabsTrigger>
            <TabsTrigger value="vm">{t("h2h.avgSpeed")}</TabsTrigger>
            <TabsTrigger value="laps">{t("h2h.lapsTab")}</TabsTrigger>
            <TabsTrigger value="consistency">{t("h2h.consistencyTab")}</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo">
            <p className="text-xs text-muted-foreground text-center mb-3">{t("h2h.commonRaces", { count: h2h.driver1.races })}</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="font-racing text-sm text-primary">{h2h.driver1.driverName.substring(0, 12)}</div>
              <div className="text-xs text-muted-foreground">{t("h2h.stat")}</div>
              <div className="font-racing text-sm text-racing-cyan">{h2h.driver2.driverName.substring(0, 12)}</div>
              {[
                { label: t("h2h.wins"), v1: h2h.driver1.wins, v2: h2h.driver2.wins },
                { label: t("h2h.podiums"), v1: h2h.driver1.podiums, v2: h2h.driver2.podiums },
                { label: t("h2h.avgPos"), v1: h2h.driver1.avgPosition, v2: h2h.driver2.avgPosition },
                { label: t("h2h.points"), v1: h2h.driver1.totalPoints, v2: h2h.driver2.totalPoints },
                { label: t("h2h.bestPos"), v1: h2h.driver1.bestPosition, v2: h2h.driver2.bestPosition },
              ].map(({ label, v1, v2 }) => (
                <StatRow key={label} label={label} v1={v1} v2={v2} lowerIsBetter={label === t("h2h.avgPos") || label === t("h2h.bestPos")} />
              ))}
            </div>
            <div className="h-40 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { stat: t("h2h.wins"), d1: h2h.driver1.wins, d2: h2h.driver2.wins },
                  { stat: t("h2h.podiums"), d1: h2h.driver1.podiums, d2: h2h.driver2.podiums },
                  { stat: t("h2h.points"), d1: h2h.driver1.totalPoints, d2: h2h.driver2.totalPoints },
                ]} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 15%)" />
                  <XAxis dataKey="stat" stroke="hsl(220 10% 55%)" fontSize={10} />
                  <YAxis stroke="hsl(220 10% 55%)" fontSize={10} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="d1" name={h2h.driver1.driverName} fill="hsl(0 85% 50%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="d2" name={h2h.driver2.driverName} fill="hsl(185 100% 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="tmv">
            <p className="text-xs text-muted-foreground mb-3">{t("h2h.bestLapByTrack")}</p>
            {(() => {
              const allTracks = new Set([
                ...h2h.driver1.bestLapsByTrack.map(b => b.trackName),
                ...h2h.driver2.bestLapsByTrack.map(b => b.trackName),
              ]);
              if (allTracks.size === 0) return <p className="text-sm text-muted-foreground text-center py-8">{t("h2h.noBlByTrack")}</p>;
              const chartData = Array.from(allTracks).map(track => ({
                track: track.substring(0, 15),
                d1: h2h.driver1.bestLapsByTrack.find(b => b.trackName === track)?.lapTime || 0,
                d2: h2h.driver2.bestLapsByTrack.find(b => b.trackName === track)?.lapTime || 0,
              }));
              return (
                <>
                  {h2h.driver1.avgBestLap && h2h.driver2.avgBestLap && (
                    <div className="grid grid-cols-3 gap-2 text-center mb-3 text-xs">
                      <div className="text-primary font-mono">{formatSeconds(h2h.driver1.avgBestLap)}</div>
                      <div className="text-muted-foreground">{t("h2h.avgBl")}</div>
                      <div className="text-racing-cyan font-mono">{formatSeconds(h2h.driver2.avgBestLap)}</div>
                    </div>
                  )}
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 15%)" />
                        <XAxis dataKey="track" stroke="hsl(220 10% 55%)" fontSize={9} />
                        <YAxis stroke="hsl(220 10% 55%)" fontSize={10} tickFormatter={(v) => formatSeconds(v)} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatSeconds(v), ""]} />
                        <Legend wrapperStyle={{ fontSize: "10px" }} />
                        <Bar dataKey="d1" name={h2h.driver1.driverName} fill="hsl(0 85% 50%)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="d2" name={h2h.driver2.driverName} fill="hsl(185 100% 50%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              );
            })()}
          </TabsContent>

          <TabsContent value="vm">
            <p className="text-xs text-muted-foreground mb-3">{t("h2h.avgSpeedPerRace")}</p>
            {(() => {
              if (h2h.driver1.avgSpeeds.length === 0 && h2h.driver2.avgSpeeds.length === 0)
                return <p className="text-sm text-muted-foreground text-center py-8">{t("h2h.noAvgSpeedData")}</p>;
              const heatIds = [...new Set([...h2h.driver1.avgSpeeds.map(s => s.heatId), ...h2h.driver2.avgSpeeds.map(s => s.heatId)])];
              const chartData = heatIds.map(hId => ({
                heat: (h2h.driver1.avgSpeeds.find(s => s.heatId === hId) || h2h.driver2.avgSpeeds.find(s => s.heatId === hId))?.heatLabel.substring(0, 15) || hId.substring(0, 8),
                d1: h2h.driver1.avgSpeeds.find(s => s.heatId === hId)?.avgSpeed || 0,
                d2: h2h.driver2.avgSpeeds.find(s => s.heatId === hId)?.avgSpeed || 0,
              }));
              return (
                <>
                  <div className="grid grid-cols-3 gap-2 text-center mb-3 text-xs">
                    <div className={`font-mono ${(h2h.driver1.avgSpeedOverall || 0) > (h2h.driver2.avgSpeedOverall || 0) ? "text-racing-green font-bold" : "text-primary"}`}>
                      {h2h.driver1.avgSpeedOverall ? `${h2h.driver1.avgSpeedOverall} km/h` : "-"}
                    </div>
                    <div className="text-muted-foreground">{t("h2h.overallAvgSpeed")}</div>
                    <div className={`font-mono ${(h2h.driver2.avgSpeedOverall || 0) > (h2h.driver1.avgSpeedOverall || 0) ? "text-racing-green font-bold" : "text-racing-cyan"}`}>
                      {h2h.driver2.avgSpeedOverall ? `${h2h.driver2.avgSpeedOverall} km/h` : "-"}
                    </div>
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 15%)" />
                        <XAxis dataKey="heat" stroke="hsl(220 10% 55%)" fontSize={9} />
                        <YAxis stroke="hsl(220 10% 55%)" fontSize={10} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} km/h`, ""]} />
                        <Legend wrapperStyle={{ fontSize: "10px" }} />
                        <Bar dataKey="d1" name={h2h.driver1.driverName} fill="hsl(0 85% 50%)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="d2" name={h2h.driver2.driverName} fill="hsl(185 100% 50%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              );
            })()}
          </TabsContent>

          <TabsContent value="laps">
            <p className="text-xs text-muted-foreground mb-3">{t("h2h.lapByLapComparison")}</p>
            <Select value={selectedHeat} onValueChange={setSelectedHeat}>
              <SelectTrigger className="mb-3">
                <SelectValue placeholder={t("h2h.selectARace")} />
              </SelectTrigger>
              <SelectContent>
                {h2h.commonHeats.map(ch => (
                  <SelectItem key={ch.heatId} value={ch.heatId}>{ch.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(() => {
              if (!selectedHeat) return <p className="text-sm text-muted-foreground text-center py-8">{t("h2h.selectRaceAbove")}</p>;
              const telemetry = h2h.lapTelemetryByHeat.get(selectedHeat);
              if (!telemetry || (telemetry.driver1.length === 0 && telemetry.driver2.length === 0))
                return <p className="text-sm text-muted-foreground text-center py-8">{t("h2h.noTelemetryForRace")}</p>;
              const maxLaps = Math.max(telemetry.driver1.length, telemetry.driver2.length);
              const chartData = Array.from({ length: maxLaps }, (_, i) => ({
                lap: i + 1,
                d1: telemetry.driver1[i]?.time || null,
                d2: telemetry.driver2[i]?.time || null,
              }));
              return (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 15%)" />
                      <XAxis dataKey="lap" stroke="hsl(220 10% 55%)" fontSize={10} label={{ value: t("analytics.lap"), position: "insideBottom", offset: -2, style: { fill: "hsl(220 10% 55%)", fontSize: 9 } }} />
                      <YAxis stroke="hsl(220 10% 55%)" fontSize={10} tickFormatter={(v) => formatSeconds(v)} domain={["dataMin - 0.5", "dataMax + 0.5"]} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatSeconds(v), ""]} />
                      <Legend wrapperStyle={{ fontSize: "10px" }} />
                      <Line type="monotone" dataKey="d1" name={h2h.driver1.driverName} stroke="hsl(0 85% 50%)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                      <Line type="monotone" dataKey="d2" name={h2h.driver2.driverName} stroke="hsl(185 100% 50%)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              );
            })()}
          </TabsContent>

          <TabsContent value="consistency">
            <p className="text-xs text-muted-foreground mb-3">{t("h2h.consistencyDesc")}</p>
            {(() => {
              if (h2h.driver1.consistencyByHeat.length === 0 && h2h.driver2.consistencyByHeat.length === 0)
                return <p className="text-sm text-muted-foreground text-center py-8">{t("h2h.noConsistencyData")}</p>;
              const allHeats = [...new Set([...h2h.driver1.consistencyByHeat.map(c => c.heatId), ...h2h.driver2.consistencyByHeat.map(c => c.heatId)])];
              const chartData = allHeats.map(hId => ({
                heat: (h2h.driver1.consistencyByHeat.find(c => c.heatId === hId) || h2h.driver2.consistencyByHeat.find(c => c.heatId === hId))?.label.substring(0, 15) || "",
                d1: h2h.driver1.consistencyByHeat.find(c => c.heatId === hId)?.stdDev || 0,
                d2: h2h.driver2.consistencyByHeat.find(c => c.heatId === hId)?.stdDev || 0,
              }));
              return (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 15%)" />
                      <XAxis dataKey="heat" stroke="hsl(220 10% 55%)" fontSize={9} />
                      <YAxis stroke="hsl(220 10% 55%)" fontSize={10} tickFormatter={(v) => `${v}s`} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}s`, t("analytics.stdDev")]} />
                      <Legend wrapperStyle={{ fontSize: "10px" }} />
                      <Bar dataKey="d1" name={h2h.driver1.driverName} fill="hsl(0 85% 50%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="d2" name={h2h.driver2.driverName} fill="hsl(185 100% 50%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              );
            })()}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function StatRow({ label, v1, v2, lowerIsBetter = false }: { label: string; v1: number; v2: number; lowerIsBetter?: boolean }) {
  const d1Better = lowerIsBetter ? v1 < v2 : v1 > v2;
  const d2Better = lowerIsBetter ? v2 < v1 : v2 > v1;
  const tie = v1 === v2;

  return (
    <>
      <div className={`font-mono text-sm ${d1Better && !tie ? "text-racing-green font-bold" : "text-foreground"}`}>{v1}</div>
      <div className="text-[10px] text-muted-foreground self-center">{label}</div>
      <div className={`font-mono text-sm ${d2Better && !tie ? "text-racing-green font-bold" : "text-foreground"}`}>{v2}</div>
    </>
  );
}