import { Suspense } from 'react';
import { Spinner } from "@nextui-org/react";
import { PoliciesAndTerms } from "@/components/PoliciesAndTerms";

function SearchBarFallback() {
  return <Spinner label="Loading..." color="primary" labelColor="primary" />
}
export default function PersonEditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='md:pb-0 pb-12'>
      <section className="flex flex-col items-center justify-center gap-4 py-4 md:py-5">
        <div className="inline-block text-center justify-center w-full sm:max-w-[1280px]">
          <Suspense fallback={<SearchBarFallback />}>
            {children}
          </Suspense>
        </div>
      </section>
      {/* <PoliciesAndTerms /> */}
    </div>
  );
}
