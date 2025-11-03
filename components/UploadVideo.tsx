"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UploadVideo({ bucket, titulo }: { bucket: string; titulo: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleUpload() {
    if (!file) return alert("Selecione um vídeo primeiro!");
    setUploading(true);

    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from(bucket).upload(fileName, file);

      if (error) throw error;

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      setVideoUrl(data.publicUrl);
      alert("✅ Vídeo enviado com sucesso!");
    } catch (err) {
      console.error(err);
      alert("❌ Erro ao enviar vídeo!");
    } finally {
      setUploading(false);
    }
  }

  async function copiarLink() {
    if (!videoUrl) return;
    await navigator.clipboard.writeText(videoUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white border rounded-lg p-4 mb-6 shadow-sm">
      <h3 className="text-md font-semibold mb-3">{titulo}</h3>

      <input
        type="file"
        accept="video/mp4"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="border p-2 rounded w-full mb-3"
      />

      <button
        onClick={handleUpload}
        disabled={uploading || !file}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {uploading ? "Enviando..." : "Enviar Vídeo"}
      </button>

      {videoUrl && (
        <div className="mt-5">
          <video
            controls
            width="100%"
            className="rounded shadow-sm border border-gray-200"
          >
            <source src={videoUrl} type="video/mp4" />
          </video>

          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={videoUrl}
              className="flex-1 border p-2 rounded text-sm text-gray-600"
            />
            <button
              onClick={copiarLink}
              className={`px-3 py-2 rounded text-sm font-medium ${
                copied
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {copied ? "✅ Copiado!" : "📋 Copiar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}