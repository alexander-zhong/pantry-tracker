import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

import fs from "fs";

const fileManager = new GoogleAIFileManager(process.env.AIKEY);

const genAI = new GoogleGenerativeAI(process.env.AIKEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function POST(request) {
  try {
    const { image } = await request.json();

    const base64String = image.replace(/^data:image\/jpeg;base64,/, "");

    const bufferImage = Buffer.from(base64String, "base64");
    fs.writeFile("test2.jpg", bufferImage, (err) => {
      if (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
      }
    });

    const uploadResponse = await fileManager.uploadFile("test2.jpg", {
      mimeType: "image/jpeg",
      displayName: "test2",
    });

    const getResponse = await fileManager.getFile(uploadResponse.file.name);

    const prompt = `Describe this file, with the file uri being ${uploadResponse.file.uri}`;

    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResponse.file.mimeType,
          fileUri: "uploadResponse.file.uri",
        },
      },
      { text: prompt },
    ]);

    const response = await result.response;
    const text = response.text();
    console.log(text);

    fs.unlink("test2.jpg", (err) => {
      if (err) {
        console.error("Error deleting file:", err);
        return;
      }
      console.log("File deleted successfully!");
    });

    return NextResponse.json({ hi: text });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
