import { getHumeAccessToken } from "@/utils/getHumeAccessToken";
import dynamic from "next/dynamic";

const SerenitySession = dynamic(() => import("@/components/SerenitySession"), {
  ssr: false,
});

export default async function Page() {
  const accessToken = await getHumeAccessToken();

  if (!accessToken) {
    throw new Error("Failed to get Hume access token");
  }

  return (
    <div className="grow flex flex-col">
      <SerenitySession accessToken={accessToken} />
    </div>
  );
}