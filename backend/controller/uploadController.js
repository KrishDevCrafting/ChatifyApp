import fs from "fs";
import path from "path";
import cloudinary from "../Config/cloudinary.js";

const handleUploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const isCloudinaryConfigured =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    if (isCloudinaryConfigured) {
      // Stream buffer directly to Cloudinary
      const uploadPromise = new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "chatify_uploads",
            resource_type: "image",
            transformation: [
              {
                quality: "auto",
                fetch_format: "auto",
              },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );
        uploadStream.end(req.file.buffer);
      });

      const result = await uploadPromise;

      return res.status(200).json({
        url: result.secure_url,
        message: "Image uploaded successfully to Cloudinary",
      });
    } else {
      // Local storage fallback for seamless local development
      const uploadsDir = path.resolve("uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const extension = path.extname(req.file.originalname) || ".png";
      const filename = `img_${Date.now()}_${Math.round(Math.random() * 1e9)}${extension}`;
      const filePath = path.join(uploadsDir, filename);

      fs.writeFileSync(filePath, req.file.buffer);

      const serverUrl =
        process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
      const localUrl = `${serverUrl}/uploads/${filename}`;

      return res.status(200).json({
        url: localUrl,
        message: "Image uploaded successfully to local storage",
      });
    }
  } catch (error) {
    console.error("Error in handleUploadImage:", error);
    return res.status(500).json({
      message: "Failed to upload image. Please check server logs.",
    });
  }
};

export { handleUploadImage };
