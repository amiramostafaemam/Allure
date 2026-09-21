function StaticPageLayout({ title, icon: Icon, children }) {
  return (
    <div className="mx-auto max-w-3xl text-left">
      <h1 className="mb-8 flex items-center gap-2 text-3xl font-bold text-base-content">
        {Icon ? <Icon className="size-8 text-primary" aria-hidden /> : null}
        {title}
      </h1>
      <div className="space-y-6 leading-relaxed text-base-content/75 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-base-content [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </div>
  );
}

export default StaticPageLayout;
