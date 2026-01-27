import type { NextApiRequest, NextApiResponse } from "next";
import { minikitConfig } from "../../minikit.config";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(200).json(minikitConfig);
}

