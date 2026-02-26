export const filesToBase64 = async (
    fileList: File[]
): Promise<{ data: string; mimeType: string }[]> => {
    return Promise.all(
        fileList.map(
            (file) =>
                new Promise<{ data: string; mimeType: string }>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const dataUrl = reader.result as string;
                        const base64 = dataUrl.split(",")[1];
                        resolve({ data: base64, mimeType: file.type || "image/jpeg" });
                    };
                    reader.readAsDataURL(file);
                })
        )
    );
};
