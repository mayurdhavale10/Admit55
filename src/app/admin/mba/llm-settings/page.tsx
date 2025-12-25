"use client";

import { useEffect, useState } from "react";

type Provider = "groq" | "openai" | "anthropic";

export default function LLMSettingsPage() {
  const [provider, setProvider] = useState<Provider>("groq");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [maskedKey, setMaskedKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Fetch existing config
  useEffect(() => {
    fetch("/api/admin/mba/llm-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.data) {
          setProvider(data.data.provider);
          setModel(data.data.model);
          setMaskedKey(data.data.apiKeyMasked || "");
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/mba/llm-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          model,
          apiKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to save");
      }

      setApiKey("");
      setMessage("✅ LLM settings updated successfully");
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">LLM Settings</h1>
      <p className="text-gray-600 mb-8">
        Configure which AI provider powers MBA tools.
      </p>

      <div className="space-y-6 bg-white p-6 rounded-xl border">
        {/* Provider */}
        <div>
          <label className="block text-sm font-medium mb-1">
            LLM Provider
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as Provider)}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="groq">Groq</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
          </select>
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Model Name
          </label>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g. llama-3.3-70b-versatile"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium mb-1">
            API Key
          </label>

          {maskedKey && (
            <p className="text-xs text-gray-500 mb-1">
              Current key: {maskedKey}
            </p>
          )}

          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste new API key"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {/* Save */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-black text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Settings"}
          </button>

          {message && (
            <span className="text-sm font-medium">{message}</span>
          )}
        </div>
      </div>
    </div>
  );
}
