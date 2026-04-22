"""
Analytics views — server-side equivalents of the Supabase-heavy useAnalyticsData hooks.

All endpoints require authentication and operate on the requesting user's data only,
except head-to-head which accepts two public driver IDs.
"""

import math

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.events.models import HeatResult, LapTelemetry
from apps.races.models import StandaloneRace, StandaloneRaceTelemetry

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_lap_time(time_str: str | None) -> float | None:
    """Convert lap time string (e.g. '1:02.345') to seconds (float)."""
    if not time_str:
        return None
    s = time_str.replace(",", ".")
    if ":" in s:
        parts = s.split(":", 1)
        try:
            return float(parts[0]) * 60 + float(parts[1])
        except ValueError:
            return None
    # Format like "1.02.345"
    dot_parts = s.split(".")
    if len(dot_parts) == 3:
        try:
            return int(dot_parts[0]) * 60 + int(dot_parts[1]) + int(dot_parts[2]) / 1000
        except ValueError:
            return None
    try:
        return float(s)
    except ValueError:
        return None


def _format_seconds(secs: float) -> str:
    mins = int(secs // 60)
    rest = secs % 60
    if mins > 0:
        return f"{mins}:{rest:06.3f}"
    return f"{rest:.3f}"


def _std_dev(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    avg = sum(values) / len(values)
    variance = sum((v - avg) ** 2 for v in values) / (len(values) - 1)
    return math.sqrt(variance)


def _champ_filter(race_type_filter: str) -> bool:
    return race_type_filter in ("all", "championship")


def _standalone_filter(race_type_filter: str) -> bool:
    return race_type_filter in ("all", "training", "standalone")


# ---------------------------------------------------------------------------
# GET /analytics/races/
# ---------------------------------------------------------------------------

class RacesListView(APIView):
    """List all races (championship heats + standalone) for the requesting user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        race_filter = request.query_params.get("filter", "all")
        user = request.user
        races = []

        if _champ_filter(race_filter):
            qs = (
                HeatResult.objects
                .filter(driver_id=user.pk, driver__isnull=False)
                .select_related("heat__event__track")
                .order_by("-heat__event__date")
            )
            for r in qs:
                heat = r.heat
                event = heat.event
                races.append({
                    "id": f"champ_{r.pk}",
                    "label": f"{event.name} - {heat.name}",
                    "date": str(event.date),
                    "type": "championship",
                    "trackName": event.track.name if event.track else None,
                })

        if _standalone_filter(race_filter):
            sa_qs = StandaloneRace.objects.filter(user_id=user.pk).order_by("-date")
            if race_filter == "training":
                sa_qs = sa_qs.filter(race_type="training")
            elif race_filter == "standalone":
                sa_qs = sa_qs.filter(race_type="standalone")

            for r in sa_qs:
                label_type = "Treino" if r.race_type == "training" else "Avulsa"
                races.append({
                    "id": f"standalone_{r.pk}",
                    "label": f"{label_type} - {r.track_name or 'Sem pista'}",
                    "date": str(r.date),
                    "type": r.race_type,
                    "trackName": r.track_name,
                })

        # Sort combined list by date descending
        races.sort(key=lambda x: x["date"], reverse=True)
        return Response(races)


# ---------------------------------------------------------------------------
# GET /analytics/lap-evolution/?race_ids=champ_xxx,standalone_yyy
# ---------------------------------------------------------------------------

class LapEvolutionView(APIView):
    """Return lap telemetry for specified race IDs."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        raw = request.query_params.get("race_ids", "")
        race_ids = [r.strip() for r in raw.split(",") if r.strip()]
        user = request.user
        results = []

        for race_id in race_ids:
            if race_id.startswith("champ_"):
                hr_pk = race_id[len("champ_"):]
                try:
                    hr = HeatResult.objects.select_related("heat__event").get(
                        pk=hr_pk, driver_id=user.pk
                    )
                except HeatResult.DoesNotExist:
                    continue

                laps_qs = LapTelemetry.objects.filter(heat_result=hr).order_by("lap_number")
                laps = []
                for lap in laps_qs:
                    t = _parse_lap_time(lap.lap_time)
                    laps.append({
                        "lap": lap.lap_number,
                        "time": t or 0,
                        "timeStr": lap.lap_time,
                        "sector1": _parse_lap_time(lap.sector1),
                        "sector2": _parse_lap_time(lap.sector2),
                        "sector3": _parse_lap_time(lap.sector3),
                        "averageSpeed": float(lap.average_speed) if lap.average_speed else None,
                        "gapToBest": lap.gap_to_best,
                        "gapToLeader": lap.gap_to_leader,
                        "kartNumber": lap.kart_number,
                        "totalTime": lap.total_time,
                    })

                if laps:
                    times = [lap_d["time"] for lap_d in laps if lap_d["time"] > 0]
                    best_idx = times.index(min(times)) if times else 0
                    worst_idx = times.index(max(times)) if times else 0
                    label = f"{hr.heat.event.name} - {hr.heat.name}"
                    results.append({
                        "raceId": race_id,
                        "raceLabel": label,
                        "laps": laps,
                        "bestLapIndex": best_idx,
                        "worstLapIndex": worst_idx,
                    })

            elif race_id.startswith("standalone_"):
                sa_pk = race_id[len("standalone_"):]
                try:
                    sa = StandaloneRace.objects.get(pk=sa_pk, user_id=user.pk)
                except StandaloneRace.DoesNotExist:
                    continue

                laps_qs = StandaloneRaceTelemetry.objects.filter(
                    standalone_race=sa
                ).order_by("lap_number")
                laps = []
                for lap in laps_qs:
                    t = _parse_lap_time(lap.lap_time)
                    laps.append({
                        "lap": lap.lap_number,
                        "time": t or 0,
                        "timeStr": lap.lap_time,
                        "sector1": _parse_lap_time(lap.sector1),
                        "sector2": _parse_lap_time(lap.sector2),
                        "sector3": _parse_lap_time(lap.sector3),
                        "averageSpeed": float(lap.average_speed) if lap.average_speed else None,
                        "gapToBest": lap.gap_to_best,
                        "gapToLeader": lap.gap_to_leader,
                        "kartNumber": lap.kart_number,
                        "totalTime": lap.total_time,
                    })

                if laps:
                    times = [lap_d["time"] for lap_d in laps if lap_d["time"] > 0]
                    best_idx = times.index(min(times)) if times else 0
                    worst_idx = times.index(max(times)) if times else 0
                    label = f"{sa.track_name or 'Sem pista'} ({sa.date})"
                    results.append({
                        "raceId": race_id,
                        "raceLabel": label,
                        "laps": laps,
                        "bestLapIndex": best_idx,
                        "worstLapIndex": worst_idx,
                    })

        return Response(results)


# ---------------------------------------------------------------------------
# GET /analytics/best-lap-evolution/?filter=all|championship|training|standalone
# ---------------------------------------------------------------------------

class BestLapEvolutionView(APIView):
    """Best lap per race over time for the requesting user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        race_filter = request.query_params.get("filter", "all")
        user = request.user
        entries = []

        if _champ_filter(race_filter):
            qs = (
                HeatResult.objects
                .filter(driver_id=user.pk, best_lap_time__isnull=False)
                .exclude(best_lap_time="")
                .select_related("heat__event")
                .order_by("heat__event__date")
            )
            for r in qs:
                t = _parse_lap_time(r.best_lap_time)
                if t:
                    entries.append({
                        "date": str(r.heat.event.date),
                        "bestLap": t,
                        "bestLapStr": r.best_lap_time,
                        "label": r.heat.event.name,
                    })

        if _standalone_filter(race_filter):
            sa_qs = (
                StandaloneRace.objects
                .filter(user_id=user.pk, best_lap_time__isnull=False)
                .exclude(best_lap_time="")
                .order_by("date")
            )
            if race_filter == "training":
                sa_qs = sa_qs.filter(race_type="training")
            elif race_filter == "standalone":
                sa_qs = sa_qs.filter(race_type="standalone")

            for r in sa_qs:
                t = _parse_lap_time(r.best_lap_time)
                if t:
                    entries.append({
                        "date": str(r.date),
                        "bestLap": t,
                        "bestLapStr": r.best_lap_time,
                        "label": r.track_name or ("Treino" if r.race_type == "training" else "Avulsa"),
                    })

        entries.sort(key=lambda x: x["date"])
        return Response(entries)


# ---------------------------------------------------------------------------
# GET /analytics/track-comparison/?filter=all|championship|training|standalone
# ---------------------------------------------------------------------------

class TrackComparisonView(APIView):
    """Per-track best and average lap stats for the requesting user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        race_filter = request.query_params.get("filter", "all")
        user = request.user
        track_map: dict[str, dict] = {}

        def _update(name: str, lap_time_str: str | None) -> None:
            entry = track_map.setdefault(name, {"times": [], "count": 0})
            entry["count"] += 1
            t = _parse_lap_time(lap_time_str)
            if t:
                entry["times"].append(t)

        if _standalone_filter(race_filter):
            sa_qs = StandaloneRace.objects.filter(
                user_id=user.pk, track_name__isnull=False
            ).exclude(track_name="")
            if race_filter == "training":
                sa_qs = sa_qs.filter(race_type="training")
            elif race_filter == "standalone":
                sa_qs = sa_qs.filter(race_type="standalone")

            for r in sa_qs:
                _update(r.track_name, r.best_lap_time)

        if _champ_filter(race_filter):
            qs = (
                HeatResult.objects
                .filter(driver_id=user.pk)
                .select_related("heat__event__track")
            )
            for r in qs:
                track = r.heat.event.track
                if track:
                    _update(track.name, r.best_lap_time)

        stats = []
        for track_name, data in track_map.items():
            times = data["times"]
            best = min(times) if times else 0.0
            avg = sum(times) / len(times) if times else 0.0
            stats.append({
                "trackName": track_name,
                "totalRaces": data["count"],
                "bestLap": best,
                "bestLapStr": _format_seconds(best) if best > 0 else "-",
                "avgLap": avg,
                "avgLapStr": _format_seconds(avg) if avg > 0 else "-",
            })

        stats.sort(key=lambda x: x["totalRaces"], reverse=True)
        return Response(stats)


# ---------------------------------------------------------------------------
# GET /analytics/kpis/?filter=all|championship|training|standalone
# ---------------------------------------------------------------------------

class KPIsView(APIView):
    """KPI summary for the requesting user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        race_filter = request.query_params.get("filter", "all")
        user = request.user

        all_best_laps: list[float] = []
        all_positions: list[int] = []
        track_counts: dict[str, int] = {}
        total_races = 0

        if _champ_filter(race_filter):
            qs = (
                HeatResult.objects
                .filter(driver_id=user.pk)
                .select_related("heat__event__track")
            )
            for r in qs:
                total_races += 1
                t = _parse_lap_time(r.best_lap_time)
                if t:
                    all_best_laps.append(t)
                if r.position:
                    all_positions.append(r.position)
                track = r.heat.event.track
                if track:
                    track_counts[track.name] = track_counts.get(track.name, 0) + 1

        if _standalone_filter(race_filter):
            sa_qs = StandaloneRace.objects.filter(user_id=user.pk)
            if race_filter == "training":
                sa_qs = sa_qs.filter(race_type="training")
            elif race_filter == "standalone":
                sa_qs = sa_qs.filter(race_type="standalone")

            for r in sa_qs:
                total_races += 1
                t = _parse_lap_time(r.best_lap_time)
                if t:
                    all_best_laps.append(t)
                if r.position:
                    all_positions.append(r.position)
                if r.track_name:
                    track_counts[r.track_name] = track_counts.get(r.track_name, 0) + 1

        best_time = min(all_best_laps) if all_best_laps else None
        podiums = sum(1 for p in all_positions if p <= 3)

        favorite_track = None
        favorite_count = 0
        for name, count in track_counts.items():
            if count > favorite_count:
                favorite_track = name
                favorite_count = count

        return Response({
            "bestLapAllTime": _format_seconds(best_time) if best_time else None,
            "bestLapTime": best_time,
            "favoriteTrack": favorite_track,
            "favoriteTrackCount": favorite_count,
            "podiumRate": round((podiums / total_races) * 100) if total_races > 0 else 0,
            "consistencyScore": round(_std_dev(all_positions) * 100) / 100 if len(all_positions) >= 2 else None,
            "totalRaces": total_races,
        })


# ---------------------------------------------------------------------------
# GET /analytics/head-to-head/?driver_id_1=uuid&driver_id_2=uuid
# ---------------------------------------------------------------------------

class HeadToHeadView(APIView):
    """Head-to-head comparison between two drivers (championship heats only)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        d1_id = request.query_params.get("driver_id_1")
        d2_id = request.query_params.get("driver_id_2")

        if not d1_id or not d2_id or d1_id == d2_id:
            return Response(
                {"detail": "Informe driver_id_1 e driver_id_2 distintos."},
                status=400,
            )

        d1_results = list(
            HeatResult.objects
            .filter(driver_id=d1_id)
            .select_related("heat__event__track")
        )
        d2_results = list(
            HeatResult.objects
            .filter(driver_id=d2_id)
            .select_related("heat__event__track")
        )

        d1_heat_map = {r.heat_id: r for r in d1_results}
        d2_heat_map = {r.heat_id: r for r in d2_results}
        common_heat_ids = set(d1_heat_map) & set(d2_heat_map)

        if not common_heat_ids:
            return Response({}, status=204)

        common_heats = []
        for h_id in common_heat_ids:
            r = d1_heat_map[h_id]
            common_heats.append({
                "heatId": str(h_id),
                "label": f"{r.heat.event.name} - {r.heat.name}",
            })

        # Fetch profiles
        from apps.profiles.models import Profile

        profile_map: dict = {}
        for p in Profile.objects.filter(user_id__in=[d1_id, d2_id]):
            profile_map[str(p.user_id)] = p

        def _driver_name(driver_id: str) -> str:
            p = profile_map.get(driver_id)
            if p:
                return p.full_name or p.username or "Piloto"
            return "Piloto"

        # Fetch lap telemetry
        d1_hr_ids = [str(d1_heat_map[h].pk) for h in common_heat_ids]
        d2_hr_ids = [str(d2_heat_map[h].pk) for h in common_heat_ids]

        d1_telem = list(LapTelemetry.objects.filter(heat_result_id__in=d1_hr_ids).order_by("lap_number"))
        d2_telem = list(LapTelemetry.objects.filter(heat_result_id__in=d2_hr_ids).order_by("lap_number"))

        # Build heat-result → heat_id mapping
        hr_to_heat_d1 = {str(d1_heat_map[h].pk): str(h) for h in common_heat_ids}
        hr_to_heat_d2 = {str(d2_heat_map[h].pk): str(h) for h in common_heat_ids}

        telem_by_heat: dict[str, dict] = {
            str(h): {"driver1": [], "driver2": []} for h in common_heat_ids
        }
        for t in d1_telem:
            heat_id = hr_to_heat_d1.get(str(t.heat_result_id))
            if heat_id:
                time = _parse_lap_time(t.lap_time)
                if time:
                    telem_by_heat[heat_id]["driver1"].append({
                        "lap": t.lap_number,
                        "time": time,
                        "timeStr": t.lap_time,
                    })
        for t in d2_telem:
            heat_id = hr_to_heat_d2.get(str(t.heat_result_id))
            if heat_id:
                time = _parse_lap_time(t.lap_time)
                if time:
                    telem_by_heat[heat_id]["driver2"].append({
                        "lap": t.lap_number,
                        "time": time,
                        "timeStr": t.lap_time,
                    })

        def _build_driver_stats(heat_map: dict, driver_id: str, is_d1: bool) -> dict:
            wins = 0
            podiums = 0
            total_points = 0
            pos_sum = 0
            pos_count = 0
            best_pos = 999
            best_laps_by_track: dict[str, float] = {}
            avg_speeds: list[dict] = []
            speed_values: list[float] = []
            best_lap_times: list[float] = []
            consistency_by_heat: list[dict] = []

            for h_id in common_heat_ids:
                r = heat_map.get(h_id)
                if not r:
                    continue
                h_str = str(h_id)
                heat_label = next((ch["label"] for ch in common_heats if ch["heatId"] == h_str), h_str)

                if r.position is not None:
                    if r.position == 1:
                        wins += 1
                    if r.position <= 3:
                        podiums += 1
                    total_points += r.points or 0
                    pos_sum += r.position
                    pos_count += 1
                    if r.position < best_pos:
                        best_pos = r.position

                track = r.heat.event.track
                lap_time = _parse_lap_time(r.best_lap_time)
                if track and lap_time:
                    existing = best_laps_by_track.get(track.name)
                    if existing is None or lap_time < existing:
                        best_laps_by_track[track.name] = lap_time
                    best_lap_times.append(lap_time)

                if r.average_speed:
                    speed = float(r.average_speed)
                    avg_speeds.append({"heatId": h_str, "heatLabel": heat_label, "avgSpeed": speed})
                    speed_values.append(speed)

                driver_laps = telem_by_heat[h_str]["driver1" if is_d1 else "driver2"]
                if len(driver_laps) >= 2:
                    times = [lap_d["time"] for lap_d in driver_laps]
                    consistency_by_heat.append({
                        "heatId": h_str,
                        "label": heat_label,
                        "stdDev": round(_std_dev(times) * 1000) / 1000,
                    })

            return {
                "driverName": _driver_name(driver_id),
                "driverId": driver_id,
                "wins": wins,
                "podiums": podiums,
                "avgPosition": round(pos_sum / pos_count * 10) / 10 if pos_count else 0,
                "totalPoints": total_points,
                "races": len(common_heat_ids),
                "bestPosition": best_pos if best_pos < 999 else 0,
                "bestLapsByTrack": [
                    {"trackName": k, "lapTime": v, "lapTimeStr": _format_seconds(v)}
                    for k, v in best_laps_by_track.items()
                ],
                "avgSpeeds": avg_speeds,
                "avgBestLap": sum(best_lap_times) / len(best_lap_times) if best_lap_times else None,
                "avgSpeedOverall": round(sum(speed_values) / len(speed_values) * 10) / 10 if speed_values else None,
                "consistencyByHeat": consistency_by_heat,
            }

        return Response({
            "driver1": _build_driver_stats(d1_heat_map, d1_id, is_d1=True),
            "driver2": _build_driver_stats(d2_heat_map, d2_id, is_d1=False),
            "commonHeats": common_heats,
            "lapTelemetryByHeat": telem_by_heat,
        })
