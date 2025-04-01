import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Chip,
  Alert,
  CircularProgress,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  VerifiedUser as VerifiedUserIcon,
  LockReset as LockResetIcon,
  PersonOutline as PersonOutlineIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { User } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import config from "../../config/env";

// Extended user type for admin panel
interface AdminUser extends User {
  createdAt: string;
  lastLogin?: string;
  status: "active" | "inactive" | "locked";
  firstName?: string;
  lastName?: string;
}

// API user type from Moka.Auth
interface MokaUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  roles?: string[];
}

const UserManagementPanel: React.FC = () => {
  const { user: currentUser, impersonateUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openResetPasswordDialog, setOpenResetPasswordDialog] = useState(false);
  const [openImpersonateDialog, setOpenImpersonateDialog] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<string | null>(
    null,
  );
  const [userToImpersonate, setUserToImpersonate] = useState<AdminUser | null>(
    null,
  );

  // Form state
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    role: "User",
    password: "",
    confirmPassword: "",
    status: "active",
  });

  // Error state
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get the auth token
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      // Call the Moka.Auth users endpoint
      const response = await axios.get(`${config.API_URL}/auth/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Transform API response to AdminUser type
      const adminUsers: AdminUser[] = response.data.map((user: MokaUser) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.roles && user.roles.includes("Admin") ? "Admin" : "User",
        token: "",
        createdAt: user.createdAt,
        lastLogin: user.lastLoginAt,
        status: user.isActive ? "active" : "inactive",
      }));

      setUsers(adminUsers);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load users";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const handleInputChange = (
    event:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent,
  ) => {
    const { name, value } = event.target;
    if (name) {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleOpenCreateDialog = () => {
    setEditUser(null);
    setFormData({
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      role: "User",
      password: "",
      confirmPassword: "",
      status: "active",
    });
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (user: AdminUser) => {
    setEditUser(user);
    setFormData({
      username: user.username,
      email: user.email || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role: user.role || "User",
      password: "",
      confirmPassword: "",
      status: user.status,
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenDeleteDialog = (userId: string) => {
    setUserToDelete(userId);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setUserToDelete(null);
  };

  const handleOpenResetPasswordDialog = (userId: string) => {
    setUserToResetPassword(userId);
    setOpenResetPasswordDialog(true);
  };

  const handleCloseResetPasswordDialog = () => {
    setOpenResetPasswordDialog(false);
    setUserToResetPassword(null);
  };

  const handleOpenImpersonateDialog = (user: AdminUser) => {
    setUserToImpersonate(user);
    setOpenImpersonateDialog(true);
  };

  const handleCloseImpersonateDialog = () => {
    setOpenImpersonateDialog(false);
    setUserToImpersonate(null);
  };

  const handleCreateOrUpdateUser = async () => {
    // Form validation
    if (!formData.username.trim()) {
      toast.error("Username is required");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }

    if (!editUser && (!formData.password || formData.password.length < 8)) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (!editUser && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      // Get the auth token
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      if (editUser) {
        // Update existing user
        const updateData = {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          isActive: formData.status === "active",
        };

        if (formData.password) {
          Object.assign(updateData, { password: formData.password });
        }

        await axios.put(
          `${config.API_URL}/auth/users/${editUser.id}`,
          updateData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        // Update role if it has changed
        const currentRole = editUser.role || "User";
        if (formData.role !== currentRole) {
          if (currentRole === "Admin") {
            // Remove from Admin role
            await axios.delete(
              `${config.API_URL}/auth/users/${editUser.id}/roles/Admin`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );
          }

          if (formData.role === "Admin") {
            // Add to Admin role
            await axios.post(
              `${config.API_URL}/auth/users/${editUser.id}/roles/Admin`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );
          }
        }

        // Update user in the local state
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === editUser.id
              ? {
                  ...user,
                  username: formData.username,
                  email: formData.email,
                  firstName: formData.firstName,
                  lastName: formData.lastName,
                  role: formData.role,
                  status: formData.status as "active" | "inactive" | "locked",
                }
              : user,
          ),
        );

        toast.success("User updated successfully!");
      } else {
        // Create new user
        const createData = {
          username: formData.username,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password,
          roles: formData.role === "Admin" ? ["Admin"] : [],
        };

        const response = await axios.post(
          `${config.API_URL}/auth/users`,
          createData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const newUser: AdminUser = {
          id: response.data.id,
          username: formData.username,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          token: "",
          createdAt: new Date().toISOString(),
          status: formData.status as "active" | "inactive" | "locked",
        };

        setUsers((prevUsers) => [...prevUsers, newUser]);

        toast.success("User created successfully!");
      }

      handleCloseDialog();
      // Refresh the user list to get the latest data
      fetchUsers();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : editUser
            ? "Failed to update user"
            : "Failed to create user";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setLoading(true);
    try {
      // Get the auth token
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      // Delete user via API
      await axios.delete(`${config.API_URL}/auth/users/${userToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Remove user from the local state
      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.id !== userToDelete),
      );

      toast.success("User deleted successfully!");
      handleCloseDeleteDialog();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete user";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!userToResetPassword) return;

    setLoading(true);
    try {
      // Generate a random password
      const randomPassword =
        Math.random().toString(36).substring(2, 10) +
        Math.random().toString(36).substring(2, 10);

      // Get the auth token
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      // Reset password via API
      await axios.put(
        `${config.API_URL}/auth/users/${userToResetPassword}`,
        { password: randomPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success(
        `Password reset successfully! New password: ${randomPassword}`,
      );
      handleCloseResetPasswordDialog();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to reset password";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonateUser = async () => {
    if (!userToImpersonate) return;

    setLoading(true);
    try {
      await impersonateUser(userToImpersonate.id);
      toast.success(`Now impersonating ${userToImpersonate.username}`);
      handleCloseImpersonateDialog();

      // Redirect to the dashboard
      navigate("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to impersonate user";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email &&
        user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.firstName &&
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.lastName &&
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  // Paginate users
  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  // Format date to display in a user-friendly way
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <TextField
          placeholder="Search users..."
          value={searchQuery}
          onChange={handleSearch}
          variant="outlined"
          size="small"
          sx={{ width: { xs: "100%", sm: "300px" } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          Add User
        </Button>
      </Box>

      <Paper sx={{ width: "100%", overflow: "hidden", borderRadius: 2 }}>
        {loading && !paginatedUsers.length ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Username</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          {user.role === "Admin" && (
                            <Tooltip title="Admin User">
                              <VerifiedUserIcon
                                color="primary"
                                fontSize="small"
                                sx={{ mr: 1 }}
                              />
                            </Tooltip>
                          )}
                          {user.username}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : "N/A"}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role || "User"}
                          color={user.role === "Admin" ? "primary" : "default"}
                          size="small"
                          variant={
                            user.role === "Admin" ? "filled" : "outlined"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.status}
                          color={
                            user.status === "active"
                              ? "success"
                              : user.status === "locked"
                                ? "error"
                                : "default"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(user.lastLogin)}</TableCell>
                      <TableCell align="right">
                        <Box
                          sx={{ display: "flex", justifyContent: "flex-end" }}
                        >
                          <Tooltip title="Reset Password">
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleOpenResetPasswordDialog(user.id)
                              }
                            >
                              <LockResetIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {/* Don't allow impersonating yourself or other admins unless you're the system admin */}
                          {user.id !== currentUser?.id &&
                            (currentUser?.username === "admin" ||
                              user.role !== "Admin") && (
                              <Tooltip title="Impersonate User">
                                <IconButton
                                  size="small"
                                  color="secondary"
                                  onClick={() =>
                                    handleOpenImpersonateDialog(user)
                                  }
                                >
                                  <PersonOutlineIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          <Tooltip title="Edit User">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEditDialog(user)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete User">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleOpenDeleteDialog(user.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" sx={{ py: 2 }}>
                        No users found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Create/Edit User Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editUser ? "Edit User" : "Create New User"}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              disabled={!!editUser}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
            />
            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <TextField
                margin="normal"
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
              />
              <TextField
                margin="normal"
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  label="Role"
                  onChange={handleInputChange}
                >
                  <MenuItem value="User">User</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  label="Status"
                  onChange={handleInputChange}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="locked">Locked</MenuItem>
                </Select>
              </FormControl>
            </Box>
            {!editUser && (
              <>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
              </>
            )}
            {editUser && (
              <TextField
                margin="normal"
                fullWidth
                name="password"
                label="New Password (leave blank to keep current)"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleCreateOrUpdateUser}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : editUser ? (
              "Update"
            ) : (
              "Create"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this user? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button
            onClick={handleDeleteUser}
            variant="contained"
            color="error"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={openResetPasswordDialog}
        onClose={handleCloseResetPasswordDialog}
      >
        <DialogTitle>Reset User Password</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will reset the user's password to a random string. The new
            password will be displayed for you to share with the user.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResetPasswordDialog}>Cancel</Button>
          <Button
            onClick={handleResetPassword}
            color="primary"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Reset Password"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Impersonate User Dialog */}
      <Dialog
        open={openImpersonateDialog}
        onClose={handleCloseImpersonateDialog}
      >
        <DialogTitle>Impersonate User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are about to impersonate {userToImpersonate?.username}. You will
            be logged in as this user and have access to all their content.
            <br />
            <br />
            To return to your admin account, click the "End Impersonation"
            button that will appear in the header.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImpersonateDialog}>Cancel</Button>
          <Button
            onClick={handleImpersonateUser}
            color="secondary"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Impersonate User"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagementPanel;
