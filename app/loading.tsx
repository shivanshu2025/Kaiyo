export default function RootLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[#E9E9E7]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#32483e] border-t-transparent" />
        <p className="text-sm font-medium text-gray-500">Loading...</p>
      </div>
    </div>
  );
}
