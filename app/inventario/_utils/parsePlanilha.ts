import * as XLSX from "xlsx";

export function parsePlanilha(file: File) {
  return new Promise<any[]>((resolve) => {
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      resolve(json);
    };

    reader.readAsArrayBuffer(file);
  });
}