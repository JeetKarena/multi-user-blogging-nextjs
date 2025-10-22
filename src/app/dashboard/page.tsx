"use client";

import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Calendar,
  FileText,
  BarChart3,
  Shield
} from "lucide-react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import withAuth from "@/components/auth/with-auth";

function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");

  // Use the new auth hook
  const { isAuthenticated, profile, profileLoading, logout } = useAuth();

  // TRPC utils for invalidation
  const utils = trpc.useUtils();

  // Get user's posts - only when authenticated
  const { data: postsData, isLoading: postsLoading } = trpc.posts.getMyPosts.useQuery({
    limit: 20,
    status: "published",
  }, {
    enabled: isAuthenticated && !!profile,
  });

  // Get user's drafts - only when authenticated
  const { data: draftsData, isLoading: draftsLoading } = trpc.posts.getMyDrafts.useQuery({
    limit: 20,
  }, {
    enabled: isAuthenticated && !!profile,
  });

  // Delete post mutation
  const deletePostMutation = trpc.posts.delete.useMutation({
    onSuccess: () => {
      toast.success("Post deleted successfully");
      // Refetch posts after deletion
      utils.posts.getMyPosts.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete post");
    },
  });

  // Delete draft mutation
  const deleteDraftMutation = trpc.posts.deleteDraft.useMutation({
    onSuccess: () => {
      toast.success("Draft deleted successfully");
      // Refetch drafts after deletion
      utils.posts.getMyDrafts.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete draft");
    },
  });

  // Action handlers
  const handleViewPost = (postId: string) => {
    // Find the post to get its slug
    const post = posts.find(p => p.id === postId);
    if (post) {
      window.open(`/blog/${post.slug}`, '_blank');
    }
  };

  const handleEditPost = (postId: string) => {
    window.location.href = `/posts/edit/${postId}`;
  };

  const handleDeletePost = (postId: string) => {
    if (confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      deletePostMutation.mutate({ id: postId });
    }
  };

  const handleEditDraft = (draftId: string) => {
    window.location.href = `/posts/create?draft=${draftId}`;
  };

  const handleDeleteDraft = (draftId: string) => {
    if (confirm("Are you sure you want to delete this draft? This action cannot be undone.")) {
      deleteDraftMutation.mutate({ id: draftId });
    }
  };

  // Extract posts array from response
  const posts = postsData?.posts || [];

  // Extract drafts array from response
  const drafts = draftsData || [];

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Helper function for status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "archived":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar variant="dashboard" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {profile?.name || "User"}!
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Manage your blog posts and account settings
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <Link href="/posts/create">
                <Button className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>New Post</span>
                </Button>
              </Link>
              {(profile?.role === 'admin' || profile?.role === 'editor') && (
                <Link href="/admin">
                  <Button variant="outline" className="flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>Admin</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{posts?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Published articles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {posts?.filter(post => post.status === 'published').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Live articles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {drafts?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Saved drafts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:data-[state=active]:border dark:data-[state=active]:border-gray-600"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="posts"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:data-[state=active]:border dark:data-[state=active]:border-gray-600"
            >
              My Posts
            </TabsTrigger>
            <TabsTrigger 
              value="drafts"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:data-[state=active]:border dark:data-[state=active]:border-gray-600"
            >
              Drafts
            </TabsTrigger>
            <TabsTrigger 
              value="profile"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:data-[state=active]:border dark:data-[state=active]:border-gray-600"
            >
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Recent Posts Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Posts</CardTitle>
                <CardDescription>
                  Your latest published articles
                </CardDescription>
              </CardHeader>
              <CardContent>
                {postsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : posts && posts.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {posts.slice(0, 6).map((post) => (
                      <Card key={post.id} className="hover:shadow-lg transition-shadow">
                        {post.featuredImage && (
                          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                            <Image
                              src={post.featuredImage}
                              alt={post.title}
                              width={400}
                              height={225}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={getStatusColor(post.status)}>
                              {post.status}
                            </Badge>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(post.createdAt)}
                            </span>
                          </div>
                          <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                            {post.title}
                          </h3>
                          {post.excerpt && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
                              {post.excerpt}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(post.createdAt)}</span>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewPost(post.id)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditPost(post.id)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600" 
                                  onClick={() => handleDeletePost(post.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No posts yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Create your first blog post to get started
                    </p>
                    <Link href="/posts/create">
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Post
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="posts" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Posts</CardTitle>
                    <CardDescription>
                      Manage all your blog posts
                    </CardDescription>
                  </div>
                  <Link href="/posts/create">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      New Post
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {postsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : posts && posts.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post) => (
                      <Card key={post.id} className="hover:shadow-lg transition-shadow">
                        {post.featuredImage && (
                          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                            <Image
                              src={post.featuredImage}
                              alt={post.title}
                              width={400}
                              height={225}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={getStatusColor(post.status)}>
                              {post.status}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewPost(post.id)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditPost(post.id)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600" 
                                  onClick={() => handleDeletePost(post.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                            {post.title}
                          </h3>
                          {post.excerpt && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
                              {post.excerpt}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>{formatDate(post.createdAt)}</span>
                            <span>{post.status}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No posts yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Create your first blog post to get started
                    </p>
                    <Link href="/posts/create">
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Post
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drafts" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Drafts</CardTitle>
                    <CardDescription>
                      Manage your blog drafts
                    </CardDescription>
                  </div>
                  <Link href="/posts/create">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      New Draft
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {draftsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : draftsData && draftsData.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {draftsData.map((draft) => (
                      <Card key={draft.id} className="hover:shadow-lg transition-shadow">
                        {draft.featuredImage && (
                          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                            <Image
                              src={draft.featuredImage}
                              alt={draft.title}
                              width={400}
                              height={225}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-lg line-clamp-2 flex-1 mr-2">{draft.title}</h3>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditDraft(draft.id)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600" 
                                  onClick={() => handleDeleteDraft(draft.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {draft.excerpt && (
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                              {draft.excerpt}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>{formatDate(draft.createdAt)}</span>
                            <span>Draft</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No drafts yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Create your first draft to get started
                    </p>
                    <Link href="/posts/create">
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Draft
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Your account details and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Name
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {profile?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {profile?.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Username
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {profile?.username || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Role
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white capitalize">
                      {profile?.role || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="pt-4">
                  <Button variant="outline" onClick={handleLogout}>
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}

export default withAuth(DashboardPage);
