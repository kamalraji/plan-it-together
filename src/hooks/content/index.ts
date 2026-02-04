/**
 * Content Hooks - Content management and media hooks
 * 
 * Re-exports hooks from the flat structure for backwards compatibility
 * while providing organized imports.
 */

// Content department data
export {
  useContentItems,
  useSpeakers,
  useMediaAssets,
  useUpdateContentItemStatus,
  useCreateContentItem,
  useContentDepartmentStats,
} from '../useContentDepartmentData';

// Content stats
export { useContentStats } from '../useContentStats';

// Content approval workflow
export {
  useContentApprovals,
  useContentApprovalDetails,
  usePendingApprovalsCount,
  useSubmitForApproval,
  useReviewApproval,
  useUpdateApprovalPriority,
  useSocialPostQueue,
  useAddToPostQueue,
  usePublishToSocial,
  useSyncSocialAnalytics,
  useSocialApiCredentials,
  useSaveSocialApiCredentials,
} from '../useContentApprovalWorkflow';

// Blog and articles
export {
  useBlogArticles,
  useCreateBlogArticle,
  useUpdateBlogArticle,
  useDeleteBlogArticle,
  useIncrementArticleViews,
  useBlogArticleStats,
} from '../useBlogArticles';

// Media assets library
export {
  useMediaAssets as useMediaAssetsLibrary,
  useMediaStats,
  useUploadMediaAsset,
  useDeleteMediaAsset,
  useIncrementUsage,
} from '../useMediaAssetsLibrary';

// Publication
export { usePublicationPipeline } from '../usePublicationPipeline';
