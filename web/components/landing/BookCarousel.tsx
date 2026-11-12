"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { CarouselBook } from "@/lib/catalog";
import { BookMesh, wrappedOffset } from "./BookMesh";

type BookCarouselProps = {
  books: CarouselBook[];
};

type SceneProps = {
  books: CarouselBook[];
  progress: number;
  onSelect: (book: CarouselBook) => void;
  dragMoved: MutableRefObject<boolean>;
};

function CarouselScene({ books, progress, onSelect, dragMoved }: SceneProps) {
  const count = books.length;

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[2, 6, 8]} intensity={1.15} castShadow />
      <directionalLight position={[-4, 3, 4]} intensity={0.35} />
      <hemisphereLight args={["#ffffff", "#d9d2c7", 0.4]} />

      <group position={[0, -0.05, 0]}>
        {books.map((book, index) => (
          <BookMesh
            key={book.id}
            book={book}
            offset={wrappedOffset(index, progress, count)}
            onSelect={onSelect}
            dragMoved={dragMoved}
          />
        ))}
      </group>

      <ContactShadows
        position={[0, -1.35, 0]}
        opacity={0.28}
        scale={14}
        blur={2.8}
        far={6}
      />
    </>
  );
}

function AutoSpin({
  enabled,
  onTick,
}: {
  enabled: boolean;
  onTick: (delta: number) => void;
}) {
  useFrame((_, delta) => {
    if (!enabled) {
      return;
    }
    onTick(delta * 0.18);
  });
  return null;
}

export function BookCarousel({ books }: BookCarouselProps) {
  const router = useRouter();
  const count = books.length;
  const [progress, setProgress] = useState(2);
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState<CarouselBook | null>(null);
  const dragMoved = useRef(false);
  const drag = useRef({
    active: false,
    startX: 0,
    startProgress: 0,
  });

  const activeIndex = useMemo(() => {
    if (count === 0) {
      return 0;
    }
    return ((Math.round(progress) % count) + count) % count;
  }, [count, progress]);

  const activeBook = books[activeIndex];

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!drag.current.active) {
        return;
      }
      const deltaX = event.clientX - drag.current.startX;
      if (Math.abs(deltaX) > 6) {
        dragMoved.current = true;
      }
      setProgress(drag.current.startProgress - deltaX / 220);
    };

    const onUp = () => {
      if (!drag.current.active) {
        return;
      }
      drag.current.active = false;
      setDragging(false);
      setProgress((value) => Math.round(value));
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }
    dragMoved.current = false;
    drag.current = {
      active: true,
      startX: event.clientX,
      startProgress: progress,
    };
    setDragging(true);
  };

  const handleSelect = useCallback(
    (book: CarouselBook) => {
      if (dragMoved.current) {
        return;
      }

      const index = books.findIndex((item) => item.id === book.id);
      if (index < 0) {
        return;
      }

      const current = ((Math.round(progress) % count) + count) % count;
      if (index !== current) {
        let delta = index - current;
        const half = count / 2;
        if (delta > half) {
          delta -= count;
        }
        if (delta < -half) {
          delta += count;
        }
        setProgress(Math.round(progress) + delta);
        return;
      }

      setSelected(book);
      window.setTimeout(() => {
        router.push(`/books/${book.id}`);
      }, 480);
    },
    [books, count, progress, router],
  );

  const onAutoTick = useCallback((delta: number) => {
    setProgress((value) => value + delta);
  }, []);

  if (count === 0) {
    return null;
  }

  return (
    <div className="relative w-full">
      <p
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[8%] overflow-hidden px-2 text-center font-display text-[clamp(2rem,11vw,7.5rem)] leading-none tracking-[0.04em] text-watermark/90 select-none"
      >
        AUTHOR&apos;S TRACE
      </p>

      <div
        className={`relative h-[260px] w-full max-w-full touch-none overflow-hidden sm:h-[340px] md:h-[400px] ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onPointerDown={onPointerDown}
      >
        <Canvas
          shadows
          dpr={[1, 1.5]}
          camera={{ position: [0, 0.15, 5.6], fov: 34 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: "transparent", width: "100%", height: "100%" }}
        >
          <Suspense fallback={null}>
            <AutoSpin enabled={!dragging && !selected} onTick={onAutoTick} />
            <CarouselScene
              books={books}
              progress={progress}
              onSelect={handleSelect}
              dragMoved={dragMoved}
            />
          </Suspense>
        </Canvas>
      </div>

      <div className="mx-auto -mt-1 flex max-w-md flex-col items-center gap-1 text-center">
        <p className="font-display text-xl text-ink md:text-2xl">
          {activeBook?.title}
        </p>
        <p className="text-sm text-muted-foreground">{activeBook?.author}</p>
        <p className="mt-1 text-xs tracking-[0.16em] text-muted-foreground/80 uppercase">
          Ťahaj · klikni pre detail
        </p>
      </div>

      <AnimatePresence>
        {selected ? (
          <motion.div
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-paper/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.86, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              className="rounded-[1.5rem] border border-rule bg-paper px-8 py-6 shadow-[0_24px_80px_rgba(26,23,20,0.12)]"
            >
              <p className="text-xs tracking-[0.2em] text-accent uppercase">
                Načítavam
              </p>
              <p className="mt-2 font-display text-2xl text-ink">{selected.title}</p>
              <p className="mt-1 text-muted-foreground">{selected.author}</p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
