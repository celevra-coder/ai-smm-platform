export default function BrandStudioDesktop(props: any) {
  const {
    brandName,
    workspace,
    selectedPostText,
    handleCopyPostText,
    openVideoSetupModal,
    isGenerating,
    isGeneratingVideoFrames,
    isVideoGenerating,
    handleGenerateAll,
    generatedBannerUrl,
    setIsBannerZoomed,
    renderBannerCard,
    handleDownloadBanner,
    handleCopyBanner,
    uploadedImageUrl,
    setUploadedImageUrl,
    imageUsageMode,
    setImageUsageMode,
    setVideoDuration,
    videoDuration,
    generatedVideoUrl,
    isAdminUser,
    useFakeVideo,
    setUseFakeVideo,
  } = props;

  return (
    <main className="hidden min-h-screen bg-[#f5f1ec] px-6 py-10 md:block">
      <div className="mx-auto max-w-5xl">

        {/* ТУК ПЕЙСТВАШ ЦЕЛИЯ <main> БЛОК ОТ page.tsx */}
        
      </div>
    </main>
  );
}