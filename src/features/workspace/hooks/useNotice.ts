import { useState, useRef, useCallback, useEffect } from "react";

export function useNotice()
{
    const [notice, setNotice] = useState("");
    const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const notify = useCallback((message: string) => {
        setNotice(message);
        if (noticeTimer.current) clearTimeout(noticeTimer.current);
        noticeTimer.current = setTimeout(() => setNotice(""), 2400);
      }, []);

      useEffect(() => () => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
  }, []);


      return { notify, notice, noticeTimer };
}