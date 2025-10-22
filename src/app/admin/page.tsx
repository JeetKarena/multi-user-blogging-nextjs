"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Shield,
  Users,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import Link from "next/link";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("posts");
  const [isMounted, setIsMounted] = useState(false);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<"user" | "editor" | "admin">("user");

  // Set mounted flag
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check authentication and admin role
  const { data: profile, isLoading: profileLoading, error } = trpc.auth.getProfile.useQuery(undefined, {
    retry: false,
    enabled: isMounted && !!localStorage.getItem('accessToken'),
  });

  // Get all posts (admin view)
  const { data: allPosts, isLoading: postsLoading, refetch: refetchPosts } = trpc.posts.getAllPostsAdmin.useQuery(undefined, {
    enabled: !!profile && (profile.role === 'admin' || profile.role === 'editor'),
  });

  // Get all users (admin only)
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = trpc.auth.getAllUsers.useQuery(undefined, {
    enabled: !!profile && profile.role === 'admin',
  });

  // Delete post mutation
  const deletePostMutation = trpc.posts.delete.useMutation({
    onSuccess: () => {
      toast.success("Post deleted successfully");
      setDeletePostId(null);
      refetchPosts();
    },
    onError: (error) => {
      toast.error("Failed to delete post: " + error.message);
    },
  });

  // Update user role mutation
  const updateRoleMutation = trpc.auth.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated successfully");
      setEditUserId(null);
      refetchUsers();
    },
    onError: (error) => {
      toast.error("Failed to update role: " + error.message);
    },
  });

  // Delete user mutation
  const deleteUserMutation = trpc.auth.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("User deleted successfully");
      setDeleteUserId(null);
      refetchUsers();
    },
    onError: (error) => {
      toast.error("Failed to delete user: " + error.message);
    },
  });

  // Publish/Unpublish mutations
  const publishMutation = trpc.posts.publish.useMutation({
    onSuccess: () => {
      toast.success("Post published successfully");
      refetchPosts();
    },
    onError: (error) => {
      toast.error("Failed to publish: " + error.message);
    },
  });

  const unpublishMutation = trpc.posts.unpublish.useMutation({
    onSuccess: () => {
      toast.success("Post unpublished successfully");
      refetchPosts();
    },
    onError: (error) => {
      toast.error("Failed to unpublish: " + error.message);
    },
  });

  // Redirect if not authenticated or not admin/editor
  useEffect(() => {
    if (isMounted && error && !profileLoading) {
      router.push("/auth/login");
    }
    if (isMounted && profile && profile.role === 'user') {
      toast.error("Access denied. Admin or Editor role required.");
      router.push("/dashboard");
    }
  }, [error, profileLoading, profile, router, isMounted]);

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

  const handleDeletePost = (postId: string) => {
    deletePostMutation.mutate({ id: postId });
  };

  const handleUpdateRole = () => {
    if (editUserId) {
      updateRoleMutation.mutate({ targetUserId: editUserId, role: selectedRole });
    }
  };

  const handlePublish = (postId: string) => {
    publishMutation.mutate({ id: postId });
  };

  const handleUnpublish = (postId: string) => {
    unpublishMutation.mutate({ id: postId });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'editor': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'user': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar variant="dashboard" />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-8 h-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {profile.role === 'admin' ? 'Admin' : 'Editor'} Dashboard
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all posts, users, and content across the platform
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              All Posts
            </TabsTrigger>
            {profile.role === 'admin' && (
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Users
              </TabsTrigger>
            )}
          </TabsList>

          {/* All Posts Tab */}
          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle>All Posts</CardTitle>
                <CardDescription>
                  Manage all blog posts from all authors
                </CardDescription>
              </CardHeader>
              <CardContent>
                {postsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : allPosts && allPosts.length > 0 ? (
                  <div className="space-y-4">
                    {allPosts.map((post) => (
                      <div
                        key={post.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                              {post.title}
                            </h3>
                            <Badge className={getStatusColor(post.status)}>
                              {post.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {post.excerpt || post.content.replace(/<[^>]*>/g, ' ').slice(0, 100) + '...'}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                            <span>Author ID: {post.authorId}</span>
                            <span>Created: {formatDate(post.createdAt)}</span>
                            {post.publishedAt && <span>Published: {formatDate(post.publishedAt)}</span>}
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/blog/${post.slug}`} className="cursor-pointer">
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/posts/edit/${post.id}`} className="cursor-pointer">
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            {post.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handlePublish(post.id)}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Publish
                              </DropdownMenuItem>
                            )}
                            {post.status === 'published' && (
                              <DropdownMenuItem onClick={() => handleUnpublish(post.id)}>
                                <XCircle className="w-4 h-4 mr-2" />
                                Unpublish
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-red-600 dark:text-red-400"
                              onClick={() => setDeletePostId(post.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No posts found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab (Admin Only) */}
          {profile.role === 'admin' && (
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage user roles and permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  ) : users && users.length > 0 ? (
                    <div className="space-y-4">
                      {users.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {user.name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {user.email}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                Joined: {formatDate(user.createdAt)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Badge className={getRoleBadgeColor(user.role)}>
                              {user.role}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditUserId(user.id);
                                    setSelectedRole(user.role as "user" | "editor" | "admin");
                                  }}
                                >
                                  <Shield className="mr-2 h-4 w-4" />
                                  Change Role
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeleteUserId(user.id)}
                                  className="text-red-600 focus:text-red-600"
                                  disabled={user.id === profile?.id}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No users found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletePostId} onOpenChange={() => setDeletePostId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePostId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletePostId && handleDeletePost(deletePostId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={!!editUserId} onOpenChange={() => setEditUserId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Select a new role for this user. Changes will take effect immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedRole} onValueChange={(value: "user" | "editor" | "admin") => setSelectedRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Role Permissions:</strong>
              </p>
              <ul className="text-xs text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                {selectedRole === 'admin' && (
                  <>
                    <li>• Full access to all features</li>
                    <li>• Manage all users and posts</li>
                    <li>• Change user roles</li>
                  </>
                )}
                {selectedRole === 'editor' && (
                  <>
                    <li>• Edit and publish any post</li>
                    <li>• Manage categories</li>
                    <li>• Cannot manage users</li>
                  </>
                )}
                {selectedRole === 'user' && (
                  <>
                    <li>• Create and edit own posts</li>
                    <li>• Limited permissions</li>
                  </>
                )}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUserId(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole}>
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone and will permanently delete all their posts and data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUserId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteUserId && deleteUserMutation.mutate({ targetUserId: deleteUserId })}
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
