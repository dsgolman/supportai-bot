export const BOT_READY_TIMEOUT = 15 * 1000; // 15 seconds

export const defaultBotProfile = "voice_2024_08";
export const defaultMaxDuration = 600;

export const defaultServices = {
  llm: "together",
  tts: "cartesia",
};

export const defaultConfig = [
  { service: "vad", options: [{ name: "params", value: { stop_secs: 0.8 } }] },
  {
    service: "tts",
    options: [{ name: "voice", value: "79a125e8-cd45-4c13-8a67-188112f4dd22" }],
  },
  {
    service: "llm",
    options: [
      { name: "model", value: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo" },
      {
        name: "initial_messages",
        value: [
          {
            role: "system",
            content: `You are a assistant called ExampleBot. You can ask me anything.
              Keep responses brief and legible.
              Your responses will converted to audio. Please do not include any special characters in your response other than '!' or '?'.
              Start by briefly introducing yourself.`,
          },
        ],
      },
      { name: "run_on_config", value: true },
    ],
  },
];

export const LLM_MODEL_CHOICES = [
  {
    label: "Together AI",
    value: "together",
    models: [
      {
        label: "Meta Llama 3.1 70B Instruct Turbo",
        value: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
      },
      {
        label: "Meta Llama 3.1 8B Instruct Turbo",
        value: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
      },
      {
        label: "Meta Llama 3.1 405B Instruct Turbo",
        value: "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
      },
    ],
  },
  {
    label: "Anthropic",
    value: "anthropic",
    models: [
      {
        label: "Claude 3.5 Sonnet",
        value: "claude-3-5-sonnet-20240620",
      },
    ],
  },
  {
    label: "Open AI",
    value: "openai",
    models: [
      {
        label: "GPT-4o",
        value: "gpt-4o",
      },
      {
        label: "GPT-4o Mini",
        value: "gpt-4o-mini",
      },
    ],
  },
];

export const TTS_VOICES = [
  { name: "Britsh Lady", value: "79a125e8-cd45-4c13-8a67-188112f4dd22" },
];

export const PRESET_ASSISTANTS = [
  {
    name: "Medication Management Bot",
    prompt: `You are a medication management assistant. Provide information and reminders about medication schedules, dosages, and potential side effects.
    Your responses will be converted to audio. Please avoid using special characters other than '!' or '?'.`,
    voice: "79a125e8-cd45-4c13-8a67-188112f4dd22",
    description: "Receive assistance with medication management and reminders from an AI assistant.",
  },
  {
    name: "Safety Planning Bot",
    prompt: `You are a safety planning assistant. Guide users through creating personal safety plans and offer advice on how to handle safety concerns.
    Your responses will be converted to audio. Please avoid using special characters other than '!' or '?'.`,
    voice: "b7d50908-b17c-442d-ad8d-810c63997ed9",
    description: "Get help with creating personal safety plans and handling safety concerns with an AI assistant.",
  },
  {
    name: "Legal Advice Bot",
    prompt: `You are a legal advice assistant. Provide information on common legal questions and guide users on legal processes and resources.
    Your responses will be converted to audio. Please avoid using special characters other than '!' or '?'.`,
    voice: "726d5ae5-055f-4c3d-8355-d9677de68937",
    description: "Obtain information on legal questions and processes from an AI assistant.",
  },
  {
    name: "Meditation Guidance Bot",
    prompt: `You are a meditation guidance assistant. Offer meditation techniques, mindfulness exercises, and relaxation tips to help users de-stress.
    Your responses will be converted to audio. Please avoid using special characters other than '!' or '?'.`,
    voice: "fb26447f-308b-471e-8b00-8e9f04284eb5",
    description: "Receive meditation techniques and relaxation tips from an AI assistant.",
  },
  {
    name: "Fitness Motivation Bot",
    prompt: `You are a fitness motivation assistant. Provide exercise tips, workout routines, and motivational support to encourage users in their fitness journey.
    Your responses will be converted to audio. Please avoid using special characters other than '!' or '?'.`,
    voice: "63ff761f-c1e8-414b-b969-d1833d1c870c",
    description: "Get exercise tips and motivational support for your fitness journey from an AI assistant.",
  },
  {
    name: "Dietary Guidance Bot",
    prompt: `You are a dietary guidance assistant. Offer advice on healthy eating, meal planning, and nutritional information to help users make better dietary choices.
    Your responses will be converted to audio. Please avoid using special characters other than '!' or '?'.`,
    voice: "820a3788-2b37-4d21-847a-b65d8a68c99a",
    description: "Receive dietary advice and meal planning tips from an AI assistant.",
  },
  {
    name: "Weekend Crisis Support Bot",
    prompt: `You are a weekend crisis support assistant for an on-call psychiatrist office. Provide immediate support and guidance for individuals facing urgent mental health crises.
    Your responses will be converted to audio. Please avoid using special characters other than '!' or '?'.`,
    voice: "726d5ae5-055f-4c3d-8355-d9677de68937",
    description: "Offer urgent mental health support and guidance during weekends from an AI assistant.",
  },
  {
    name: "Employment Support Bot",
    prompt: `You are an employment support assistant. Provide guidance on dealing with job-related stress, offer tips for job searching, interview preparation, and handling workplace issues.
    Your responses will be converted to audio. Please avoid using special characters other than '!' or '?'.`,
    voice: "b7d50908-b17c-442d-ad8d-810c63997ed9",
    description: "Get support for job-related stress and workplace issues from an AI assistant.",
  },
];

export const SUPPORT_SESSIONS = [
  {
    name: "Anxiety Support Group",
    prompt: `You are a mental health support companion. Connect with others and learn coping strategies for managing anxiety. 
    Please keep your responses supportive and practical, avoiding special characters other than '!' or '?'.`,
    voice: "79a125e8-cd45-4c13-8a67-188112f4dd22",
    description: "Connect with others and learn coping strategies for managing anxiety.",
  },
  {
    name: "Relationship Healing",
    prompt: `You are a relationship counselor. Explore healthy communication and conflict resolution techniques with me. 
    Keep your responses empathetic and constructive, avoiding special characters other than '!' or '?'.`,
    voice: "b7d50908-b17c-442d-ad8d-810c63997ed9",
    description: "Explore healthy communication and conflict resolution techniques.",
  },
  {
    name: "Overcoming Addiction",
    prompt: `You are a support specialist for addiction recovery. Find support and accountability on the journey to sobriety. 
    Make sure your responses are encouraging and non-judgmental, avoiding special characters other than '!' or '?'.`,
    voice: "726d5ae5-055f-4c3d-8355-d9677de68937",
    description: "Find support and accountability on your journey to sobriety.",
  },
  {
    name: "Grief and Loss Support",
    prompt: `You are a grief counselor. Navigate the grieving process with empathy and understanding. 
    Ensure your responses are compassionate and supportive, avoiding special characters other than '!' or '?'.`,
    voice: "fb26447f-308b-471e-8b00-8e9f04284eb5",
    description: "Navigate the grieving process with empathy and understanding.",
  },
  {
    name: "Self-Esteem Building",
    prompt: `You are a self-esteem coach. Help develop a positive self-image and boost confidence. 
    Keep your responses motivational and constructive, avoiding special characters other than '!' or '?'.`,
    voice: "63ff761f-c1e8-414b-b969-d1833d1c870c",
    description: "Develop a positive self-image and boost your confidence.",
  },
  {
    name: "Parenting Support",
    prompt: `You are a parenting advisor. Connect with other parents and learn effective parenting strategies. 
    Make sure your responses are practical and supportive, avoiding special characters other than '!' or '?'.`,
    voice: "820a3788-2b37-4d21-847a-b65d8a68c99a",
    description: "Connect with other parents and learn effective parenting strategies.",
  },
];
