import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Space, Tag, Typography } from "antd";

const { Text } = Typography;

function pad2(n) {
  return String(n).padStart(2, "0");
}

export default function PomodoroTimer({ initialMinutes = 25, onComplete }) {
  const initialSeconds = useMemo(() => Math.max(1, initialMinutes) * 60, [initialMinutes]);

  const [running, setRunning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const [completedCount, setCompletedCount] = useState(0);

  const intervalRef = useRef(null);

  const mm = Math.floor(remainingSeconds / 60);
  const ss = remainingSeconds % 60;

  const stop = () => {
    setRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const reset = () => {
    stop();
    setRemainingSeconds(initialSeconds);
  };

  useEffect(() => {
    // if initialMinutes changes
    setRemainingSeconds(initialSeconds);
    stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSeconds]);

  useEffect(() => {
    if (!running) return;

    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          // complete
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setRunning(false);
          setCompletedCount((c) => c + 1);
          if (onComplete) onComplete();
          return initialSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running, initialSeconds, onComplete]);

  return (
    <div>
      <Space align="center" wrap>
        <Text strong style={{ fontSize: 24 }}>
          {pad2(mm)}:{pad2(ss)}
        </Text>
        <Tag color={running ? "green" : "default"}>{running ? "运行中" : "已暂停"}</Tag>
        <Tag>完成次数：{completedCount}</Tag>
      </Space>

      <div style={{ height: 12 }} />

      <Space wrap>
        <Button type="primary" onClick={() => setRunning(true)} disabled={running}>
          开始
        </Button>
        <Button onClick={() => setRunning(false)} disabled={!running}>
          暂停
        </Button>
        <Button onClick={reset}>
          重置
        </Button>
      </Space>
    </div>
  );
}
