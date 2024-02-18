import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { followingQuery, walletQuery } from "../api";
import { init, fetchQuery } from "@airstack/node";
import { account, walletClient, publicClient } from "./config";
import ABI from "./abi.json";

const URL = process.env.ENVIRONMENT === 'local' ?
  process.env.LOCALHOST : process.env.PROD_URL

// USDC contract address on Base
const contractAddress = "0xcfA132E353cB4E398080B9700609bb008eceB125";
const USDCxAddress = "0xD04383398dD2426297da660F9CCA3d439AF9ce1b";

init(process.env.AIRSTACK_KEY || "");

let image;
const notFollowingImage = "https://i.imgflip.com/8fvawm.jpg";
const notAddressImage = "https://i.imgflip.com/8fvb2d.jpg";
const final = "https://i.imgur.com/NvF1M5r.jpeg";
const noGreedImage = "https://i.imgflip.com/8fvcls.jpg";

const alreadyClaimed : any[] = [];

image = notFollowingImage;

const _html = (img, msg, action, url) => `
<!DOCTYPE html>
<html>
  <head>
    <title>Frame</title>
    <mega property="og:image" content="${img}" />
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${img}" />
    <meta property="fc:frame:image:aspect_ratio" content="1:1" />
    <meta property="fc:frame:button:1" content="${msg}" />
    <meta property="fc:frame:button:1:action" content="${action}" />
    <meta property="fc:frame:button:1:post" content="${url}" />
  </head>
</html>
`;

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function POST(req) {
  const data = await req.json();

  const { untrustedData } = data;
  const { fid } = untrustedData;

  const _query = followingQuery(fid);
  const { data: results } = await fetchQuery(_query, {
    id: fid,
  });

  const _query2 = walletQuery(fid);
  const { data: results2 } = await fetchQuery(_query2, {
    id: fid,
  });

  const socials = results2.Socials.Social
  const address = socials[0].userAssociatedAddresses[0]

  if (!results.Wallet.socialFollowers.Follower) {
    return new NextResponse(_html(notFollowingImage, "Retry", "post_redirect", `${URL}`));
  }

  if (alreadyClaimed.includes(fid)) {
    return new NextResponse(_html(noGreedImage, "See in Dashboard", "link", `https://app.superfluid.finance/?view=${address}`));
  }

  image = final;

  const flowRate = getRandomInt(152090329488, 190112911861);
  const { request } = await publicClient.simulateContract({
    address: contractAddress,
    abi: ABI,
    functionName: "setFlowrate",
    account,
    args: [USDCxAddress, address, flowRate],
  });
  await walletClient.writeContract(request);

  alreadyClaimed.push(fid);

  return new NextResponse(_html(image, "See in Dashboard", "link", `https://app.superfluid.finance/?view=${address}`));
}

export const dynamic = "force-dynamic";
