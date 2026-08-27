export function MovingBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.035]" />
      <div
        className="bg-blob-a absolute -left-32 -top-32 size-[32rem] rounded-full bg-primary/25 blur-[100px]"
      />
      <div
        className="bg-blob-b absolute -right-24 top-1/4 size-[28rem] rounded-full bg-accent/20 blur-[110px]"
      />
      <div
        className="bg-blob-c absolute bottom-[-10rem] left-1/3 size-[26rem] rounded-full bg-success/10 blur-[100px]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
    </div>
  );
}
