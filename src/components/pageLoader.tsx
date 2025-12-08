export default function PageLoader() {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4">
        <h1 className="text-3xl font-bold tracking-wide text-black">
          rent<span className="font-extrabold">N</span>ride
        </h1>
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-black"></div>
      </div>
    );
  }
  