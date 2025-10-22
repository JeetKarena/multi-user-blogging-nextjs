"use client";

import { useState, useEffect, useCallback, Suspense, lazy } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Send, 
  Loader2,
  FileText,
  Tag,
  Calendar,
  AlertCircle,
  Image as ImageIcon,
  X,
  Plus,
  Clock,
  Search
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Lazy load the RichTextEditor component
const RichTextEditor = lazy(() => import("@/components/ui/rich-text-editor"));

const createPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  content: z.string().refine((content) => {
    // Strip HTML tags and count actual text content
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    return textContent.length >= 10;
  }, "Content must be at least 10 characters (excluding formatting)"),
  excerpt: z.string().max(300, "Excerpt must be less than 300 characters").optional(),
  featuredImage: z.string().optional().or(z.literal("")),
  status: z.enum(["draft", "published"]),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  metaTitle: z.string().max(60, "Meta title must be less than 60 characters").optional(),
  metaDescription: z.string().max(160, "Meta description must be less than 160 characters").optional(),
  publishedAt: z.date().optional(),
  scheduledPublish: z.boolean().optional(),
});

type CreatePostForm = z.infer<typeof createPostSchema>;

function CreatePostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [readTime, setReadTime] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [scheduledPublish, setScheduledPublish] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Set mounted flag
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check authentication - only after mounting
  const { data: profile, isLoading: profileLoading } = trpc.auth.getProfile.useQuery(undefined, {
    retry: false,
    enabled: isMounted && !!localStorage.getItem('accessToken'),
  });

  // Get categories for selection
  const { data: categories } = trpc.categories.getAll.useQuery({ includePostCount: false });

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
    setValue,
    getValues,
  } = useForm<CreatePostForm>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      status: "draft",
      categories: [],
      tags: [],
      scheduledPublish: false,
    },
  });

  const createPostMutation = trpc.posts.create.useMutation({
    onSuccess: () => {
      const status = watch("status");
      toast.success(`Post ${status === "published" ? "published" : "saved as draft"} successfully!`);
      window.location.href = "/dashboard";
    },
    onError: (error) => {
      toast.error("Failed to create post: " + error.message);
      setIsSubmitting(false);
    },
  });

  const createDraftMutation = trpc.posts.createDraft.useMutation({
    onSuccess: () => {
      toast.success("Draft saved successfully!");
      window.location.href = "/dashboard";
    },
    onError: (error) => {
      toast.error("Failed to save draft: " + error.message);
      setIsSubmitting(false);
    },
  });

  const updateDraftMutation = trpc.posts.updateDraft.useMutation({
    onSuccess: () => {
      toast.success("Draft updated successfully!");
      window.location.href = "/dashboard";
    },
    onError: (error) => {
      toast.error("Failed to update draft: " + error.message);
      setIsSubmitting(false);
    },
  });

  // Get draft ID from URL params
  const draftId = searchParams.get('draft');

  // Load draft if draftId is present
  const { data: draftData, isLoading: draftLoading } = trpc.posts.getDraftById.useQuery(
    { id: draftId! },
    {
      enabled: !!draftId && !!profile,
    }
  );

  // Populate form when draft data is loaded
  useEffect(() => {
    if (draftData) {
      // Populate form with draft data
      setValue("title", draftData.title);
      setValue("content", draftData.content);
      setValue("excerpt", draftData.excerpt || "");
      setValue("metaTitle", draftData.metaTitle || "");
      setValue("metaDescription", draftData.metaDescription || "");
      
      // Set featured image if exists
      if (draftData.featuredImage) {
        setFeaturedImageUrl(draftData.featuredImage);
      }
      
      // Set tags
      if (draftData.tags) {
        setTags(draftData.tags);
      }
      
      // Set categories
      if (draftData.categories) {
        setSelectedCategories(draftData.categories);
      }
      
      toast.success("Draft loaded successfully!");
    }
  }, [draftData, setValue]);

  // Redirect if not authenticated
  useEffect(() => {
    if (isMounted && !profileLoading && !profile) {
      router.push("/auth/login");
    }
  }, [profile, profileLoading, router, isMounted]);

  // Calculate word count and reading time
  const content = watch("content") || "";
  useEffect(() => {
    // Strip HTML tags for word count
    const text = content.replace(/<[^>]*>/g, ' ');
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    setWordCount(words);
    setReadTime(Math.ceil(words / 200));
  }, [content]);

  // Auto-save functionality
  const autoSaveDraft = useCallback(() => {
    if (!autoSaveEnabled) return;
    
    const formData = getValues();
    if (!formData.title || !formData.content) return;

    // Save to localStorage
    localStorage.setItem('draft-post', JSON.stringify({
      ...formData,
      savedAt: new Date().toISOString()
    }));
    
    setLastSaved(new Date());
    toast.success("Draft auto-saved", { duration: 2000 });
  }, [autoSaveEnabled, getValues]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!autoSaveEnabled) return;
    
    const interval = setInterval(() => {
      autoSaveDraft();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoSaveDraft, autoSaveEnabled]);

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('draft-post');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (window.confirm('Would you like to restore your previous draft?')) {
          setValue('title', draft.title);
          setValue('content', draft.content);
          setValue('excerpt', draft.excerpt);
          setValue('featuredImage', draft.featuredImage);
          setValue('metaTitle', draft.metaTitle);
          setValue('metaDescription', draft.metaDescription);
          setSelectedCategories(draft.categories || []);
          setTags(draft.tags || []);
          setFeaturedImageUrl(draft.featuredImage || '');
        }
      } catch (error) {
        console.error('Failed to restore draft:', error);
      }
    }
  }, [setValue]);

  if (profileLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: CreatePostForm) => {
    setIsSubmitting(true);
    createPostMutation.mutate({
      ...data,
      categories: selectedCategories,
      tags,
      featuredImage: featuredImageUrl || undefined,
      publishedAt: data.publishedAt ? data.publishedAt.toISOString() : undefined,
    });
  };

  const handleSaveDraft = () => {
    setIsSubmitting(true);
    const formData = getValues();
    
    if (draftId) {
      // Update existing draft
      updateDraftMutation.mutate({
        id: draftId,
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        featuredImage: featuredImageUrl || undefined,
        tags,
        categories: selectedCategories,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
      });
    } else {
      // Create new draft
      createDraftMutation.mutate({
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        featuredImage: featuredImageUrl || undefined,
        tags,
        categories: selectedCategories,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
      });
    }
  };

  const handlePublish = () => {
    setValue("status", "published");
    if (!scheduledPublish) {
      setValue("publishedAt", new Date());
    }
    handleSubmit(onSubmit)();
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const handleImageUpload = () => {
    setImageDialogOpen(true);
  };

  const handleImageUrlSubmit = async () => {
    if (imageUrlInput.trim()) {
      setFeaturedImageUrl(imageUrlInput.trim());
      setValue("featuredImage", imageUrlInput.trim());
      setImageUrlInput("");
      setImageDialogOpen(false);
      toast.success("Featured image added successfully!");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setFeaturedImageUrl(data.url);
      setValue("featuredImage", data.url);
      setImageDialogOpen(false);
      toast.success("Image uploaded successfully!");
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar variant="dashboard" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {draftId ? 'Edit Draft' : 'Create New Post'}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {draftId ? 'Continue working on your saved draft' : 'Write and publish your next blog post'}
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats & Auto-save Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <FileText className="w-4 h-4 mr-2" />
              <span className="font-medium">{wordCount}</span>
              <span className="ml-1">words</span>
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4 mr-2" />
              <span className="font-medium">{readTime}</span>
              <span className="ml-1">min read</span>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={autoSaveEnabled}
                onCheckedChange={setAutoSaveEnabled}
              />
              <Label className="text-sm cursor-pointer">Auto-save</Label>
            </div>
            {lastSaved && (
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                Last saved: {lastSaved.toLocaleTimeString()}
              </div>
            )}
            <div className="flex-1"></div>
            <Badge variant={watch("status") === "published" ? "default" : "secondary"}>
              {watch("status") === "published" ? "Published" : "Draft"}
            </Badge>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Left Column */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Post Content</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Create your blog post with rich text formatting
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-gray-700 dark:text-gray-300 text-base font-medium">
                      Title *
                    </Label>
                    <Input
                      id="title"
                      type="text"
                      placeholder="Enter an engaging title for your post..."
                      {...register("title")}
                      className={cn(
                        "text-lg h-12 transition-all duration-200",
                        errors.title
                          ? "border-red-300 focus:border-red-500 dark:border-red-600"
                          : "border-gray-300 focus:border-blue-500 dark:border-gray-600"
                      )}
                    />
                    {errors.title && (
                      <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.title.message}
                      </div>
                    )}
                  </div>

                  {/* Excerpt */}
                  <div className="space-y-2">
                    <Label htmlFor="excerpt" className="text-gray-700 dark:text-gray-300 text-base font-medium">
                      Excerpt (Optional)
                    </Label>
                    <Input
                      id="excerpt"
                      type="text"
                      placeholder="A brief summary shown in listings..."
                      {...register("excerpt")}
                      className="transition-all duration-200"
                    />
                    {errors.excerpt && (
                      <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.excerpt.message}
                      </div>
                    )}
                  </div>

                  {/* Rich Text Editor */}
                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-gray-300 text-base font-medium">
                      Content *
                    </Label>
                    <Controller
                      name="content"
                      control={control}
                      render={({ field }) => (
                        <Suspense fallback={
                          <div className="min-h-[400px] flex items-center justify-center border rounded-lg bg-gray-50 dark:bg-gray-900">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                          </div>
                        }>
                          <RichTextEditor
                            content={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Start writing your amazing content..."
                          />
                        </Suspense>
                      )}
                    />
                    {errors.content && (
                      <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.content.message}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* SEO Settings */}
              <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white flex items-center">
                    <Search className="w-5 h-5 mr-2" />
                    SEO Settings
                  </CardTitle>
                  <CardDescription>
                    Optimize your post for search engines
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="metaTitle" className="text-sm font-medium">
                      Meta Title
                    </Label>
                    <Input
                      id="metaTitle"
                      placeholder="SEO title (recommended: 50-60 characters)"
                      {...register("metaTitle")}
                    />
                    <p className="text-xs text-gray-500">
                      {watch("metaTitle")?.length || 0}/60 characters
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="metaDescription" className="text-sm font-medium">
                      Meta Description
                    </Label>
                    <textarea
                      id="metaDescription"
                      rows={3}
                      placeholder="SEO description (recommended: 150-160 characters)"
                      {...register("metaDescription")}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500">
                      {watch("metaDescription")?.length || 0}/160 characters
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Right Column */}
            <div className="space-y-6">
              {/* Featured Image */}
              <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-base">Featured Image</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {featuredImageUrl ? (
                    <div className="relative group">
                      <div className="relative w-full h-48 rounded-lg overflow-hidden">
                        <Image
                          src={featuredImageUrl}
                          alt="Featured"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFeaturedImageUrl("");
                          setValue("featuredImage", "");
                        }}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleImageUpload}
                      className="w-full"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Upload Image
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Categories */}
              {categories && categories.length > 0 && (
                <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="text-base">Categories</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {categories.map((category) => (
                      <Badge
                        key={category.id}
                        variant={selectedCategories.includes(category.id) ? "default" : "outline"}
                        className="cursor-pointer mr-2 mb-2"
                        onClick={() => toggleCategory(category.id)}
                      >
                        {category.name}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Tags */}
              <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <Tag className="w-4 h-4 mr-2" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add a tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" size="sm" onClick={addTag}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Scheduled Publishing */}
              <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-base">Publishing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="scheduled" className="cursor-pointer">
                      Schedule publish
                    </Label>
                    <Switch
                      id="scheduled"
                      checked={scheduledPublish}
                      onCheckedChange={setScheduledPublish}
                    />
                  </div>
                  {scheduledPublish && (
                    <Input
                      type="datetime-local"
                      {...register("publishedAt", {
                        valueAsDate: true,
                      })}
                      className="text-sm"
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Warning Alert */}
          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive" className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                Please fix the errors above before saving or publishing your post.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sticky bottom-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none"
            >
              {isSubmitting && watch("status") === "draft" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save as Draft
                </>
              )}
            </Button>
            
            <Button
              type="button"
              onClick={handlePublish}
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              {isSubmitting && watch("status") === "published" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {scheduledPublish ? "Schedule Post" : "Publish Now"}
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Image URL Dialog */}
        <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                Featured Image
              </DialogTitle>
              <DialogDescription>
                Enter the URL of the image you want to use as the featured image, or upload a new image file.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <Input
                type="text"
                placeholder="https://example.com/image.jpg"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className="w-full mb-4"
              />
              <div className="flex justify-between gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setImageDialogOpen(false);
                    setImageUrlInput("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImageUrlSubmit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Submit URL
                </Button>
              </div>
            </div>
            <div className="mt-4 border-t pt-4">
              <Label className="text-sm font-medium mb-2">
                Or upload an image file
              </Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="text-sm"
              />
              {uploadingImage && (
                <div className="flex items-center text-sm text-gray-500 mt-2">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading image...
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Footer />
    </div>
  );
}

export default function CreatePostPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <CreatePostPage />
    </Suspense>
  );
}
