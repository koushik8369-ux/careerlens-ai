export function toSafeUser(user) {
  const id = user._id ?? user.id;
  return {
    id: id?.toString(),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}