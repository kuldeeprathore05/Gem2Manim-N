import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import axios from "axios";
import connectDb from "@/config/database";
import Video from "@/models/Video";
import {renderVideo} from '@/inngest/functions/renderVideo'
// app/api/inngest/route.ts



export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [renderVideo],
});