"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    async function redirectToLastWorkbook() {
      try {
        const res = await axios.get("http://localhost:5001/workbook/init");
        const workbookId = res.data.workbookId;
        if (workbookId) {
          router.push(`/workbook/${workbookId}`);
        }
      } catch (err) {
        console.error("Error initializing workbook:", err);
        // If init fails, redirect to dashboard
        router.push("/dashboard");
      }
    }

    redirectToLastWorkbook();
  }, [router]);

  return null;
}
