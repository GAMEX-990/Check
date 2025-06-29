import React from "react";
import Image from "next/image";

const LoadingSpinner = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-50">
      <div className="relative animate-bounce">
        <Image
          src="/assets/images/Logocheck.PNG"
          alt="Loading Logo"
          width={100}
          height={100}
          className="animate-spin"
          style={{ animationDuration: "2s" }}
        />
      </div>
    </div>
  );
};

export default LoadingSpinner;
