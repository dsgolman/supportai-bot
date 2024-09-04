// [POST] /api/pipecat
export async function POST(request: Request) {
  try {
    // Log incoming request body
    const { services, config } = await request.json();
    console.log("Received request with services and config:", { services, config });

    if (!services || !config) {
      console.error("Services or config not found on request body");
      return Response.json(`Services or config not found on request body`, {
        status: 400,
      });
    }

    const payload = {
      bot_profile: "voice_2024_08",
      max_duration: 600,
      services,
      api_keys: {
        // Include any specific API keys needed for Pipecat here
      },
      config,
    };

    console.log("Payload to be sent to Pipecat:", payload);

    const req = await fetch("http://localhost:7860/start_bot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Include any necessary authentication headers if required by Pipecat
        // Authorization: `Bearer ${process.env.PIPECAT_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    console.log("Fetch request status:", req.status);
    const res = await req.json();
    console.log("Response from Pipecat:", res);

    if (req.status !== 200) {
      console.error("Error response from Pipecat:", res);
      return Response.json(res, { status: req.status });
    }

    return Response.json(res);
  } catch (error) {
    console.error("Error occurred during fetch operation:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
