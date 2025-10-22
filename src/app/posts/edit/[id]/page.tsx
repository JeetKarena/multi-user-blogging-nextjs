"use client";

import { useState, useEffect, Suspense, lazy } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/utils/trpc";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { 
  Save, 
  Eye, 
  Trash2, 
  Calendar, 
  Image as ImageIcon, 
  Tag, 
  FileText,
  Clock,
  X,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

// Lazy load the RichTextEditor component
const RichTextEditor = lazy(() => import("@/components/ui/rich-text-editor"));

const updatePostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]),
  featuredImage: z.string().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  publishedAt: z.date().optional(),
  scheduledPublish: z.boolean().optional(),
});

type UpdatePostForm = z.infer<typeof updatePostSchema>;

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  
  const [isMounted, setIsMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [scheduledPublish, setScheduledPublish] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);

  // Set mounted flag
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check authentication
  const { data: profile, isLoading: profileLoading } = trpc.auth.getProfile.useQuery(undefined, {
    retry: false,
    enabled: isMounted && !!localStorage.getItem('accessToken'),
  });

  // Get post data
  const { data: post, isLoading: postLoading } = trpc.posts.getById.useQuery(
    { id: postId },
    { enabled: !!postId }
  );

  // Get categories
  const { data: categories } = trpc.categories.getAll.useQuery({ includePostCount: false });

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
    setValue,
    reset,
  } = useForm<UpdatePostForm>({
    resolver: zodResolver(updatePostSchema),
  });

  // Update mutation
  const updatePostMutation = trpc.posts.update.useMutation({
    onSuccess: () => {
      toast.success("Post updated successfully!");
      setIsSubmitting(false);
      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error("Failed to update post: " + error.message);
      setIsSubmitting(false);
    },
  });

  // Delete mutation
  const deletePostMutation = trpc.posts.delete.useMutation({
    onSuccess: () => {
      toast.success("Post deleted successfully!");
      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error("Failed to delete post: " + error.message);
    },
  });

  // Load post data into form
  useEffect(() => {
    if (post) {
      reset({
        title: post.title,
        content: post.content,
        excerpt: post.excerpt || "",
        status: post.status,
        featuredImage: post.featuredImage || "",
        tags: post.tags || [],
        metaTitle: "",
        metaDescription: "",
      });
      setFeaturedImageUrl(post.featuredImage || "");
      setTags(post.tags || []);
      if (post.publishedAt) {
        setValue("publishedAt", new Date(post.publishedAt));
        setScheduledPublish(true);
      }
    }
  }, [post, reset, setValue]);

  // Redirect if not authenticated
  useEffect(() => {
    if (isMounted && !profileLoading && !profile) {
      router.push("/auth/login");
    }
  }, [profile, profileLoading, router, isMounted]);

  // Calculate word count and reading time
  const content = watch("content") || "";
  useEffect(() => {
    const text = content.replace(/<[^>]*>/g, ' ');
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    setWordCount(words);
    setReadingTime(Math.ceil(words / 200));
  }, [content]);

  if (profileLoading || postLoading || !profile || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading post...</p>
        </div>
      </div>
    );
  }

  // Check permissions
  const canEdit = profile.id === post.authorId || profile.role === 'admin' || profile.role === 'editor';
  
  if (!canEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don&apos;t have permission to edit this post.
          </p>
          <Button onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: UpdatePostForm) => {
    setIsSubmitting(true);
    
    updatePostMutation.mutate({
      id: postId,
      data: {
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        status: data.status,
        featuredImage: data.featuredImage,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        publishedAt: data.publishedAt ? data.publishedAt.toISOString() : undefined,
      },
      categories: selectedCategories,
      tags,
    });
  };

  const handleUpdateStatus = (status: "draft" | "published" | "archived") => {
    setValue("status", status);
    handleSubmit(onSubmit)();
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      deletePostMutation.mutate({ id: postId });
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar variant="dashboard" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Post</h1>
              <p className="text-gray-600 dark:text-gray-400">
                {profile.role === 'admin' || profile.role === 'editor' ? 'Admin/Editor Mode' : 'Editing your post'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Main Content */}
            <Card>
              <CardHeader>
                <CardTitle>Post Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title */}
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    {...register("title")}
                    placeholder="Enter post title..."
                    className="text-lg"
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
                  )}
                </div>

                {/* Excerpt */}
                <div>
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Input
                    id="excerpt"
                    {...register("excerpt")}
                    placeholder="Brief description (optional)"
                  />
                </div>

                {/* Rich Text Editor */}
                <div>
                  <Label>Content *</Label>
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
                          content={field.value}
                          onChange={field.onChange}
                          placeholder="Write your content here..."
                        />
                      </Suspense>
                    )}
                  />
                  {errors.content && (
                    <p className="text-sm text-red-600 mt-1">{errors.content.message}</p>
                  )}
                  <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mt-2">
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {wordCount} words
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {readingTime} min read
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Featured Image */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Featured Image
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Image URL</Label>
                  <Input
                    value={featuredImageUrl}
                    onChange={(e) => setFeaturedImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg or /uploads/filename.jpg"
                  />
                </div>
                
                <div>
                  <Label>Upload Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const formData = new FormData();
                        formData.append('file', file);
                        
                        try {
                          const response = await fetch('/api/upload', {
                            method: 'POST',
                            body: formData,
                          });
                          
                          const result = await response.json();
                          if (result.success) {
                            setFeaturedImageUrl(result.url);
                            toast.success('Image uploaded successfully!');
                          } else {
                            toast.error(result.error || 'Upload failed');
                          }
                        } catch {
                          toast.error('Upload failed');
                        }
                      }
                    }}
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Max file size: 5MB. Supported formats: JPEG, PNG, WebP
                  </p>
                </div>
                
                {featuredImageUrl && (
                  <div>
                    <Label>Preview</Label>
                    <div className="mt-2">
                      <Image 
                        src={featuredImageUrl} 
                        alt="Featured image preview" 
                        width={400}
                        height={200}
                        className="max-w-full h-48 object-cover rounded-lg border"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Categories & Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Categories & Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Categories */}
                <div>
                  <Label>Categories</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {categories?.map((category) => (
                      <Badge
                        key={category.id}
                        variant={selectedCategories.includes(category.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleCategory(category.id)}
                      >
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <Label>Tags</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Add tags..."
                    />
                    <Button type="button" onClick={addTag}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                        <X
                          className="w-3 h-3 ml-1 cursor-pointer"
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Publishing Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Publishing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Schedule Publish</Label>
                  <Switch
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
                  />
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard")}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleUpdateStatus("draft")}
                disabled={isSubmitting}
              >
                Save as Draft
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? "Updating..." : "Update Post"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{watch("title") || "Untitled Post"}</DialogTitle>
            <DialogDescription>Preview of your post</DialogDescription>
          </DialogHeader>
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
