import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, FileText, AlertCircle, CheckCircle2, Download } from "lucide-react";
import { useAdminBulkInsertHeatResults, BulkHeatResultData } from "@/hooks/useAdminMutations";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  heatId: string;
  heatName: string;
}

interface ParsedRow {
  position: number;
  driver_name_text: string;
  kart_number: number | null;
  best_lap_time: string;
  total_time: string;
  gap_to_leader: string;
  gap_to_previous: string;
  average_speed: number | null;
  total_laps: number | null;
  points: number;
  isValid: boolean;
  errors: string[];
}

const CSV_HEADERS = [
  "posição",
  "piloto",
  "kart",
  "melhor_volta",
  "tempo_total",
  "gap_lider",
  "gap_anterior",
  "velocidade_media",
  "voltas",
  "pontos",
];

export function CSVImportDialog({ open, onOpenChange, heatId, heatName }: CSVImportDialogProps) {
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [parseError, setParseError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkInsert = useAdminBulkInsertHeatResults();
  const { toast } = useToast();

  const downloadTemplate = () => {
    const headers = CSV_HEADERS.join(";");
    const exampleRow = "1;João Silva;42;01:23.456;15:30.789;+0.000;+0.000;65.5;12;25";
    const csvContent = `${headers}\n${exampleRow}`;
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modelo_resultados.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (content: string): ParsedRow[] => {
    const lines = content.trim().split("\n");
    if (lines.length < 2) {
      setParseError("O arquivo deve ter pelo menos um cabeçalho e uma linha de dados");
      return [];
    }

    const headerLine = lines[0].toLowerCase().trim();
    const delimiter = headerLine.includes(";") ? ";" : ",";
    
    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(delimiter).map((v) => v.trim());
      const errors: string[] = [];

      const position = parseInt(values[0]) || 0;
      if (position <= 0) errors.push("Posição inválida");

      const driver_name_text = values[1] || "";
      if (!driver_name_text) errors.push("Nome do piloto obrigatório");

      const kart_number = values[2] ? parseInt(values[2]) : null;
      const best_lap_time = values[3] || "";
      const total_time = values[4] || "";
      const gap_to_leader = values[5] || "";
      const gap_to_previous = values[6] || "";
      const average_speed = values[7] ? parseFloat(values[7].replace(",", ".")) : null;
      const total_laps = values[8] ? parseInt(values[8]) : null;
      const points = parseInt(values[9]) || 0;

      rows.push({
        position,
        driver_name_text,
        kart_number,
        best_lap_time,
        total_time,
        gap_to_leader,
        gap_to_previous,
        average_speed,
        total_laps,
        points,
        isValid: errors.length === 0,
        errors,
      });
    }

    return rows;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParseError("");

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseCSV(content);
      setParsedData(parsed);
    };
    reader.onerror = () => {
      setParseError("Erro ao ler o arquivo");
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleImport = async () => {
    const validRows = parsedData.filter((row) => row.isValid);
    if (validRows.length === 0) {
      toast({ title: "Nenhuma linha válida para importar", variant: "destructive" });
      return;
    }

    const results: BulkHeatResultData[] = validRows.map((row) => ({
      heat_id: heatId,
      position: row.position,
      driver_name_text: row.driver_name_text || null,
      kart_number: row.kart_number,
      best_lap_time: row.best_lap_time || null,
      total_time: row.total_time || null,
      gap_to_leader: row.gap_to_leader || null,
      gap_to_previous: row.gap_to_previous || null,
      average_speed: row.average_speed,
      total_laps: row.total_laps,
      points: row.points,
    }));

    try {
      await bulkInsert.mutateAsync({ heatId, results });
      toast({ title: `${validRows.length} resultados importados com sucesso!` });
      handleClose();
    } catch (error) {
      toast({ title: "Erro ao importar resultados", variant: "destructive" });
    }
  };

  const handleClose = () => {
    setParsedData([]);
    setFileName("");
    setParseError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    onOpenChange(false);
  };

  const validCount = parsedData.filter((r) => r.isValid).length;
  const invalidCount = parsedData.filter((r) => !r.isValid).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="stat-card border-border max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-racing text-xl flex items-center gap-2">
            <Upload className="w-5 h-5 text-racing-red" />
            Importar Resultados via CSV
          </DialogTitle>
          <DialogDescription>
            Importando para: <strong>{heatName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template download */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4" />
              <span>Baixe o modelo CSV para preencher</span>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Modelo CSV
            </Button>
          </div>

          {/* File input */}
          <div>
            <Label>Arquivo CSV</Label>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="racing-input mt-1"
            />
            {fileName && (
              <p className="text-sm text-muted-foreground mt-1">
                Arquivo selecionado: {fileName}
              </p>
            )}
          </div>

          {/* Parse error */}
          {parseError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}

          {/* Preview table */}
          {parsedData.length > 0 && (
            <>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-green-500">
                  <CheckCircle2 className="w-4 h-4" />
                  {validCount} válidos
                </span>
                {invalidCount > 0 && (
                  <span className="flex items-center gap-1 text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    {invalidCount} com erro
                  </span>
                )}
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">✓</TableHead>
                      <TableHead>Pos</TableHead>
                      <TableHead>Piloto</TableHead>
                      <TableHead>Kart</TableHead>
                      <TableHead>Melhor Volta</TableHead>
                      <TableHead>Tempo Total</TableHead>
                      <TableHead>Pts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((row, idx) => (
                      <TableRow
                        key={idx}
                        className={!row.isValid ? "bg-destructive/10" : ""}
                      >
                        <TableCell>
                          {row.isValid ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell className="font-bold">{row.position}º</TableCell>
                        <TableCell>{row.driver_name_text || "—"}</TableCell>
                        <TableCell>{row.kart_number || "—"}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {row.best_lap_time || "—"}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {row.total_time || "—"}
                        </TableCell>
                        <TableCell className="font-bold text-racing-red">
                          {row.points}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" className="flex-1" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1 racing-gradient-red text-white font-semibold"
            onClick={handleImport}
            disabled={validCount === 0 || bulkInsert.isPending}
          >
            {bulkInsert.isPending
              ? "Importando..."
              : `Importar ${validCount} Resultado${validCount !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
