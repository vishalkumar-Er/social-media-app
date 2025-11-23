const API = 'http://localhost:5000/api';
let token = '';
let currentUser = null;

// ----- Toast/Alert System
function Toast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);min-width:120px;padding:14px 30px;background:#6228d7;color:#fff;border-radius:24px;display:none;font-weight:700;z-index:999';
    document.body.appendChild(el);
  }
  el.innerText = msg;
  el.style.display = 'block';
  setTimeout(()=>{ el.style.display='none'; }, 1500);
}

window.onload = function() { showLogin(); };

function showLogin() {
  document.getElementById('login-tab').classList.add('active');
  document.getElementById('register-tab').classList.remove('active');
  document.getElementById('auth-content').innerHTML = `
    <input type="text" id="username" placeholder="Username" class="auth-input" autocomplete="off"/>
    <input type="password" id="password" placeholder="Password" class="auth-input" />
    <button class="auth-btn" onclick="login()">Login</button>
  `;
}

function showRegister() {
  document.getElementById('register-tab').classList.add('active');
  document.getElementById('login-tab').classList.remove('active');
  document.getElementById('auth-content').innerHTML = `
    <input type="text" id="reg-username" placeholder="Username" class="auth-input" autocomplete="off"/>
    <input type="password" id="reg-password" placeholder="Password" class="auth-input" />
    <input type="text" id="reg-bio" placeholder="Bio (optional)" class="auth-input" />
    <input type="text" id="reg-avatar" placeholder="Avatar Image URL (optional)" class="auth-input" />
    <button class="auth-btn" onclick="register()">Register</button>
  `;
}

async function register() {
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value.trim();
  const bio = document.getElementById('reg-bio').value.trim();
  const avatar = document.getElementById('reg-avatar').value.trim();
  const res = await fetch(API + '/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, bio, avatar })
  });
  const data = await res.json();
  if (data.message) {
    document.getElementById('auth-message').innerText = 'Registration successful! Please Login.';
    showLogin();
  } else {
    document.getElementById('auth-message').innerText = data.error || 'Registration failed!';
  }
}

async function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const res = await fetch(API + '/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (data.token) {
    token = data.token;
    currentUser = data.user;
    showMain();
  } else {
    document.getElementById('auth-message').innerText = data.error || 'Login failed!';
  }
}

function showMain() {
  document.getElementById('auth-container').style.display = 'none';
  document.getElementById('main-container').style.display = 'flex';
  document.getElementById('nav-user').style.display = 'flex';
  document.getElementById('nav-username').innerText = '@' + currentUser.username;

  // Search input for posts and users:
  if (!document.getElementById('search')) {
    const nav = document.querySelector('nav');
    const searchBar = document.createElement('input');
    searchBar.id = 'search';
    searchBar.placeholder = "Search users/posts...";
    searchBar.style.cssText = "width:180px;padding:6px 10px;border-radius:10px;margin-left:30px;border:1px solid #ffa3a3;outline:none;";
    nav.appendChild(searchBar);
    searchBar.oninput = function() { searchFilter(this.value); };
  }
  getFeed();
  getUsers();
  updateProfileSidebar();
}

function logout() {
  token = '';
  currentUser = null;
  document.getElementById('main-container').style.display = 'none';
  document.getElementById('auth-container').style.display = 'block';
  document.getElementById('nav-user').style.display = 'none';
}

async function createPost() {
  const content = document.getElementById('post-content').value.trim();
  if (!content) return;
  await fetch(API + '/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: currentUser._id, content })
  });
  document.getElementById('post-content').value = '';
  getFeed();
  updateProfileSidebar();
}

// "Time ago"
function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff/60)}m ago`;
  if (diff < 86400) return `${Math.round(diff/3600)}h ago`;
  return `${Math.round(diff/86400)}d ago`;
}

// FEED
let allPosts = [];
async function getFeed() {
  const res = await fetch(API + '/posts');
  const posts = await res.json();
  allPosts = posts;
  renderFeed(posts);
}
function renderFeed(posts) {
  let html = '';
  posts.forEach(post => {
    html += `
      <div class="post">
        <div class="post-user">@${post.user.username}</div>
        <div>${post.content}</div>
        <div style="color:#888;font-size:13px;">${timeAgo(post.createdAt)}</div>
        <div class="post-actions">
          <button class="like-btn" onclick="likePost('${post._id}')">👍 ${post.likes.length}</button>
          <button class="comment-btn" onclick="showCommentBox('${post._id}')">💬 ${post.comments.length || 0}</button>
          ${
            (post.user._id === currentUser._id)
              ? `<button onclick="deletePost('${post._id}')">🗑️</button>`
              : ""
          }
        </div>
        <div class="comment-list" id="comment-section-${post._id}">
          ${(post.comments||[]).map(c => `<div><i>${c.text}</i></div>`).join('')}
        </div>
      </div>
    `;
  });
  document.getElementById('feed').innerHTML = html;
  updateProfileSidebar();
}

// Like post
async function likePost(postId) {
  await fetch(API + `/posts/${postId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: currentUser._id })
  });
  Toast('Post Liked!');
  getFeed();
}

// Delete post
async function deletePost(id) {
  if (!confirm("Delete this post?")) return;
  const res = await fetch(`${API}/posts/${id}`, { method: 'DELETE' });
  const data = await res.json();
  Toast(data.message || "Deleted");
  getFeed();
}

// Add comment
function showCommentBox(postId) {
  document.getElementById(`comment-section-${postId}`).innerHTML += `
    <div class="comment-box">
      <input type="text" id="cmt-box-${postId}" placeholder="Comment..." />
      <button onclick="addComment('${postId}')">Post</button>
    </div>
  `;
}
async function addComment(postId) {
  const val = document.getElementById(`cmt-box-${postId}`).value;
  await fetch(API + `/posts/${postId}/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: currentUser._id, text: val })
  });
  Toast('Comment added');
  getFeed();
}

// USERS & FOLLOW
let allUsers = [];
async function getUsers() {
  const res = await fetch(API + '/users');
  const users = await res.json();
  allUsers = users;
  renderUsers(users);
}
function renderUsers(users) {
  let html = '';
  users.forEach(user => {
    if(user._id !== currentUser._id) {
      html += `<div class="user-row">@${user.username}
        <button onclick="followUser('${user._id}')">Follow</button>
      </div>`;
    }
  });
  document.getElementById('users').innerHTML = html;
}
async function followUser(uid) {
  const res = await fetch(API + `/users/${uid}/follow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: currentUser._id })
  });
  const data = await res.json();
  if(!res.ok) Toast(data.message || 'Error');
  else Toast('User followed!');
  getUsers();
  updateProfileSidebar();
}

// PROFILE EDIT
function toggleEditProfile() {
  const editBox = document.getElementById('profile-edit');
  if (!editBox) return;
  editBox.style.display = editBox.style.display === "none" ? "block" : "none";
  document.getElementById('edit-bio').value = currentUser.bio || '';
  document.getElementById('edit-avatar').value = currentUser.avatar || '';
}
async function saveProfile() {
  const bio = document.getElementById('edit-bio').value;
  const avatar = document.getElementById('edit-avatar').value;
  const res = await fetch(`${API}/users/${currentUser._id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bio, avatar })
  });
  const data = await res.json();
  if (data.user) {
    currentUser = data.user;
    Toast('Profile Updated!');
    document.getElementById('profile-edit').style.display = "none";
    updateProfileSidebar();
  } else {
    Toast(data.error || 'Update failed');
  }
}

// Profile display
function showProfile() {
  document.getElementById('profile-sidebar').style.display = 'block';
  updateProfileSidebar();
}
function hideProfile() {
  document.getElementById('profile-sidebar').style.display = 'none';
}
function updateProfileSidebar() {
  if(!currentUser) return;
  document.getElementById('profile-username').innerText = currentUser.username;
  document.getElementById('profile-bio').innerText = currentUser.bio || "(no bio)";
  document.getElementById('profile-pic').src = currentUser.avatar
    ? currentUser.avatar
    : `https://i.pravatar.cc/100?u=${currentUser.username}`;
  fetch(API + '/users')
    .then(res => res.json())
    .then(users => {
      const me = users.find(u=>u._id===currentUser._id) || currentUser;
      document.getElementById('follower-count').innerText = me.followers?.length || 0;
      document.getElementById('follower-count').style.cursor = 'pointer';
      document.getElementById('follower-count').onclick = showFollowers;
      document.getElementById('following-count').innerText = me.following?.length || 0;
    });
  fetch(API + '/posts')
    .then(res => res.json())
    .then(posts => {
      const userPosts = (posts||[]).filter(p=>p.user?._id===currentUser._id);
      document.getElementById('post-count').innerText = userPosts.length || 0;
    });
}

// Followers Modal Popup
function showFollowers() {
  fetch(API + '/users')
    .then(res => res.json())
    .then(users => {
      const me = users.find(u=>u._id===currentUser._id);
      let list = me.followers.map(id => {
        const user = users.find(u => u._id === id);
        return `<li>@${user?.username || "unknown"}</li>`;
      }).join('');
      let modal = document.getElementById('followers-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = "followers-modal";
        modal.style.cssText = "display:block;position:fixed;top:90px;left:50%;transform:translateX(-50%);background:#fff;padding:30px 40px;border-radius:18px;box-shadow:0 6px 20px #2224;z-index:1002;min-width:250px";
        document.body.appendChild(modal);
      }
      modal.innerHTML =
        `<h4>Your Followers</h4><ul>${list || "No followers"}</ul>
         <button onclick="hideFollowers()">Close</button>`;
      modal.style.display = 'block';
    });
}
function hideFollowers() {
  let modal = document.getElementById('followers-modal');
  if (modal) modal.style.display = 'none';
}

// Search filter — posts/users
function searchFilter(q) {
  q = (q || "").toLowerCase();
  renderFeed(allPosts.filter(p =>
    p.content.toLowerCase().includes(q) ||
    (p.user.username && p.user.username.toLowerCase().includes(q))
  ));
  renderUsers(allUsers.filter(u => u.username.toLowerCase().includes(q)));
}
