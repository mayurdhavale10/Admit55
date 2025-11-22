export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt || prompt.trim().length === 0) {
      return Response.json(
        { error: "Prompt cannot be empty." },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://api-inference.huggingface.co/models/Mayururur/admit55-llama32-3b-lora",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
        }),
      }
    );

    // If HF API fails
    if (!response.ok) {
      const err = await response.text();
      return Response.json(
        { error: "HuggingFace inference failed", details: err },
        { status: 500 }
      );
    }

    const output = await response.json();

    return Response.json({
      success: true,
      model_output: output,
    });
  } catch (error) {
    console.error("❌ Inference error:", error);
    return Response.json(
      { error: "Server error during inference" },
      { status: 500 }
    );
  }
}
