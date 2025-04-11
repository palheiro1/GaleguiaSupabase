// Galeguia Courses Management Functions

// DOM Elements
const coursesScreen = document.getElementById('courses-screen');
const courseEditorScreen = document.getElementById('course-editor-screen');
const coursesList = document.getElementById('courses-list');
const noCoursesMessage = document.getElementById('no-courses-message');
const newCourseBtn = document.getElementById('new-course-btn');
const backToCoursesBtn = document.getElementById('back-to-courses-btn');
const courseDetailsForm = document.getElementById('course-details-form');
const saveModuleBtn = document.getElementById('save-module-btn');
const saveLessonBtn = document.getElementById('save-lesson-btn');
const addModuleBtn = document.getElementById('add-module-btn');
const noModulesMessage = document.getElementById('no-modules-message');
const modulesContainer = document.getElementById('modules-container');
const courseEditorTitle = document.getElementById('course-editor-title');
const deleteCourseBtn = document.getElementById('delete-course-btn');

// Bootstrap modals
let moduleModal = null;
let lessonModal = null;

// Current state
let currentCourseId = null;
let currentModuleId = null;
let currentLessonId = null;
let userCourses = [];
let currentCourseModules = [];
let isAdmin = false;

// Initialize Bootstrap modals
function initModals() {
  moduleModal = new bootstrap.Modal(document.getElementById('module-modal'));
  lessonModal = new bootstrap.Modal(document.getElementById('lesson-modal'));
  
  // Handle lesson type change
  document.getElementById('lesson-type').addEventListener('change', function(e) {
    const lessonType = e.target.value;
    const contentContainer = document.getElementById('lesson-content-container');
    const videoContainer = document.getElementById('lesson-video-container');
    
    if (lessonType === 'video') {
      contentContainer.classList.add('hidden');
      videoContainer.classList.remove('hidden');
    } else {
      contentContainer.classList.remove('hidden');
      videoContainer.classList.add('hidden');
    }
  });
}

// Load all courses created by the user
async function loadUserCourses() {
  try {
    // First, check if the user profile exists and get admin status
    const userID = currentUser.id;
    console.log("Current user ID:", userID);
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userID)
      .maybeSingle();
    
    if (profileError) {
      console.error("Error fetching profile:", profileError);
      // If we can't get the profile, just assume the user is not an admin
      isAdmin = false;
    } else {
      isAdmin = profile?.is_admin === true;
    }
    
    console.log("User is admin:", isAdmin);
    
    // Now we'll use a simpler approach to get courses
    let coursesQuery;
    
    // For both admins and regular users, just get courses they have access to
    // Explicitly define which columns to fetch to avoid auth.users references
    coursesQuery = await supabase
      .from('courses')
      .select('id, title, description, cover_image_url, is_published, created_at, created_by, updated_at')
      .order('created_at', { ascending: false });
    
    const { data: courses, error } = coursesQuery;
    
    if (error) throw error;
    
    // Get module counts for each course
    const courseIds = courses.map(c => c.id);
    
    if (courseIds.length > 0) {
      const { data: modules } = await supabase
        .from('modules')
        .select('course_id, id')
        .in('course_id', courseIds);
      
      // Count modules per course
      const moduleCounts = {};
      modules?.forEach(module => {
        moduleCounts[module.course_id] = (moduleCounts[module.course_id] || 0) + 1;
      });
      
      // Add module counts to each course
      courses.forEach(course => {
        course.modules = [{ count: moduleCounts[course.id] || 0 }];
      });
      
      // For admin users, also get the creator information
      if (isAdmin) {
        const creatorIds = [...new Set(courses.map(c => c.created_by))];
        
        if (creatorIds.length > 0) {
          const { data: creators } = await supabase
            .from('profiles')
            .select('id, username, full_name')
            .in('id', creatorIds);
          
          const creatorMap = {};
          creators?.forEach(creator => {
            creatorMap[creator.id] = creator;
          });
          
          courses.forEach(course => {
            course.creator = creatorMap[course.created_by];
          });
        }
      }
    }
    
    userCourses = courses || [];
    renderCoursesList();
    
  } catch (error) {
    console.error('Error loading courses:', error.message);
    showErrorAlert('Error loading courses: ' + error.message);
  }
}

// Render the courses list
function renderCoursesList() {
  coursesList.innerHTML = '';
  
  if (userCourses.length === 0) {
    noCoursesMessage.classList.remove('hidden');
    return;
  }
  
  noCoursesMessage.classList.add('hidden');
  
  // Add admin indicator if user is admin
  if (isAdmin) {
    const adminAlert = document.createElement('div');
    adminAlert.className = 'alert alert-info mb-3';
    adminAlert.innerHTML = '<strong>Admin Mode:</strong> You can view all courses from all creators.';
    coursesList.parentNode.insertBefore(adminAlert, coursesList);
  }
  
  userCourses.forEach(course => {
    const moduleCount = course.modules[0]?.count || 0;
    const col = document.createElement('div');
    col.className = 'col-md-4';
    
    // Creator info shown only for admin
    const creatorInfo = isAdmin && course.creator 
      ? `<div class="mt-2 text-muted">Creator: ${course.creator.full_name || course.creator.username}</div>` 
      : '';
    
    col.innerHTML = `
      <div class="card course-card" data-id="${course.id}">
        <div class="card-img-top bg-light d-flex align-items-center justify-content-center" style="height: 180px; overflow: hidden;">
          ${course.cover_image_url 
            ? `<img src="${course.cover_image_url}" class="img-fluid" alt="${course.title}">`
            : `<div class="text-center text-muted">No cover image</div>`
          }
        </div>
        <div class="card-body">
          <h5 class="card-title">${course.title}</h5>
          <p class="card-text text-truncate">${course.description || 'No description'}</p>
          <div class="d-flex justify-content-between align-items-center">
            <span class="badge ${course.is_published ? 'bg-success' : 'bg-secondary'}">
              ${course.is_published ? 'Published' : 'Draft'}
            </span>
            <span class="text-muted">${moduleCount} module${moduleCount !== 1 ? 's' : ''}</span>
          </div>
          ${creatorInfo}
        </div>
      </div>
    `;
    
    col.querySelector('.course-card').addEventListener('click', () => editCourse(course.id));
    coursesList.appendChild(col);
  });
}

// Create new course
function createNewCourse() {
  currentCourseId = null;
  currentModuleId = null;
  currentLessonId = null;
  
  // Reset form
  courseDetailsForm.reset();
  document.getElementById('edit-course-id').value = '';
  document.getElementById('cover-image-preview').classList.add('hidden');
  
  // Update UI
  courseEditorTitle.textContent = 'Create New Course';
  deleteCourseBtn.classList.add('hidden');
  showCourseEditor();
  
  // Default to details tab
  const tabTriggerEl = document.querySelector('#course-editor-tabs a[href="#details-tab"]');
  bootstrap.Tab.getOrCreateInstance(tabTriggerEl).show();
}

// Edit existing course
async function editCourse(courseId) {
  currentCourseId = courseId;
  currentModuleId = null;
  currentLessonId = null;
  
  try {
    // Get course details
    const { data: course, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();
    
    if (error) throw error;
    
    // For admin, show a notice that they're editing someone else's course
    const isOwnCourse = course.created_by === currentUser.id;
    if (isAdmin && !isOwnCourse) {
      // Get creator info if needed
      let creatorName = 'another user';
      
      if (!course.creator) {
        const { data: creatorProfile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', course.created_by)
          .single();
          
        if (creatorProfile) {
          creatorName = creatorProfile.username;
        }
      } else {
        creatorName = course.creator.username || 'another user';
      }
      
      // Remove any existing admin notices first
      const existingNotices = document.querySelectorAll('#details-tab .alert-warning');
      existingNotices.forEach(notice => notice.remove());
      
      // Add the admin notice
      const adminNotice = document.createElement('div');
      adminNotice.className = 'alert alert-warning mb-3';
      adminNotice.innerHTML = `<strong>Admin Notice:</strong> You are editing a course created by ${creatorName}.`;
      document.querySelector('#details-tab').prepend(adminNotice);
    }
    
    // Populate form
    document.getElementById('edit-course-id').value = course.id;
    document.getElementById('course-title').value = course.title;
    document.getElementById('course-description').value = course.description || '';
    document.getElementById('course-is-published').checked = course.is_published;
    
    // Update cover image preview if available
    const coverPreview = document.getElementById('cover-image-preview');
    const coverPreviewImg = document.getElementById('cover-preview-img');
    
    if (course.cover_image_url) {
      coverPreviewImg.src = course.cover_image_url;
      coverPreview.classList.remove('hidden');
    } else {
      coverPreview.classList.add('hidden');
    }
    
    // Update UI
    courseEditorTitle.textContent = `Edit Course: ${course.title}`;
    deleteCourseBtn.classList.remove('hidden');
    showCourseEditor();
    
    // Load modules for this course
    loadCourseModules(courseId);
    
  } catch (error) {
    console.error('Error loading course:', error.message);
    showErrorAlert('Error loading course: ' + error.message);
  }
}

// Save course details
async function saveCourse(e) {
  e.preventDefault();
  
  const courseTitle = document.getElementById('course-title').value;
  const courseDescription = document.getElementById('course-description').value;
  const isPublished = document.getElementById('course-is-published').checked;
  const coverImageFile = document.getElementById('course-cover-image').files[0];
  
  try {
    let courseData = {
      title: courseTitle,
      description: courseDescription,
      is_published: isPublished,
      updated_at: new Date().toISOString()
    };
    
    let result;
    
    if (currentCourseId) {
      // Update existing course
      const { data, error } = await supabase
        .from('courses')
        .update(courseData)
        .eq('id', currentCourseId)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
      
    } else {
      // Create new course - explicitly set created_by
      courseData.created_by = currentUser.id;
      
      const { data, error } = await supabase
        .from('courses')
        .insert([courseData])
        .select()
        .single();
      
      if (error) throw error;
      result = data;
      currentCourseId = result.id;
    }
    
    // Handle cover image upload if selected
    if (coverImageFile) {
      const filePath = `course_covers/${currentCourseId}/${Date.now()}_${coverImageFile.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(filePath, coverImageFile, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data } = supabase.storage
        .from('course-materials')
        .getPublicUrl(filePath);
      
      // Update course with cover image URL
      const { error: updateError } = await supabase
        .from('courses')
        .update({ 
          cover_image_url: data.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentCourseId);
      
      if (updateError) throw updateError;
      
      // Update preview
      const coverPreview = document.getElementById('cover-image-preview');
      const coverPreviewImg = document.getElementById('cover-preview-img');
      coverPreviewImg.src = data.publicUrl;
      coverPreview.classList.remove('hidden');
    }
    
    showSuccessAlert('Course saved successfully');
    
    // If this was a new course, update the UI for editing
    if (!currentCourseId) {
      courseEditorTitle.textContent = `Edit Course: ${courseTitle}`;
      deleteCourseBtn.classList.remove('hidden');
    }
    
    // Reload courses list
    loadUserCourses();
    
  } catch (error) {
    console.error('Error saving course:', error.message);
    showErrorAlert('Error saving course: ' + error.message);
  }
}

// Delete a course
async function deleteCourse() {
  if (!currentCourseId) return;
  
  if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
    return;
  }
  
  try {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', currentCourseId);
    
    if (error) throw error;
    
    showSuccessAlert('Course deleted successfully');
    loadUserCourses();
    showCoursesScreen();
    
  } catch (error) {
    console.error('Error deleting course:', error.message);
    showErrorAlert('Error deleting course: ' + error.message);
  }
}

// Load modules for a course
async function loadCourseModules(courseId) {
  try {
    const { data: modules, error } = await supabase
      .from('modules')
      .select(`
        id, 
        title, 
        description, 
        order,
        lessons:lessons (
          id,
          title,
          type,
          order
        )
      `)
      .eq('course_id', courseId)
      .order('order', { ascending: true });
    
    if (error) throw error;
    
    // Sort lessons within each module
    modules.forEach(module => {
      module.lessons.sort((a, b) => a.order - b.order);
    });
    
    currentCourseModules = modules;
    renderModules(modules);
    
  } catch (error) {
    console.error('Error loading modules:', error.message);
    showErrorAlert('Error loading modules: ' + error.message);
  }
}

// Render modules list
function renderModules(modules) {
  modulesContainer.innerHTML = '';
  
  if (modules.length === 0) {
    noModulesMessage.classList.remove('hidden');
    return;
  }
  
  noModulesMessage.classList.add('hidden');
  
  modules.forEach(module => {
    const moduleElement = document.createElement('div');
    moduleElement.className = 'card module-card';
    moduleElement.dataset.id = module.id;
    
    moduleElement.innerHTML = `
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">${module.title}</h5>
        <div>
          <button type="button" class="btn btn-sm btn-primary add-lesson-btn">Add Lesson</button>
          <button type="button" class="btn btn-sm btn-outline-secondary edit-module-btn">Edit</button>
          <button type="button" class="btn btn-sm btn-outline-danger delete-module-btn">Delete</button>
        </div>
      </div>
      <div class="card-body">
        ${module.description ? `<p class="card-text">${module.description}</p>` : ''}
        <div class="lessons-container">
          ${module.lessons.length === 0 
            ? '<div class="text-muted">No lessons in this module yet</div>' 
            : '<ol class="lessons-list">' + 
                module.lessons.map(lesson => `
                  <li class="lesson-item d-flex justify-content-between align-items-center" data-id="${lesson.id}">
                    <div>${lesson.title} <span class="badge bg-info">${lesson.type}</span></div>
                    <div>
                      <button type="button" class="btn btn-sm btn-outline-secondary edit-lesson-btn">Edit</button>
                      <button type="button" class="btn btn-sm btn-outline-danger delete-lesson-btn">Delete</button>
                    </div>
                  </li>
                `).join('') + 
              '</ol>'
          }
        </div>
      </div>
    `;
    
    // Add event listeners
    moduleElement.querySelector('.add-lesson-btn').addEventListener('click', () => openAddLessonModal(module.id));
    moduleElement.querySelector('.edit-module-btn').addEventListener('click', () => openEditModuleModal(module.id));
    moduleElement.querySelector('.delete-module-btn').addEventListener('click', () => deleteModule(module.id));
    
    // Add lesson event listeners
    const lessonBtns = moduleElement.querySelectorAll('.lesson-item');
    lessonBtns.forEach(lessonItem => {
      const lessonId = lessonItem.dataset.id;
      lessonItem.querySelector('.edit-lesson-btn').addEventListener('click', () => openEditLessonModal(lessonId));
      lessonItem.querySelector('.delete-lesson-btn').addEventListener('click', () => deleteLesson(lessonId));
    });
    
    modulesContainer.appendChild(moduleElement);
  });
}

// Open module modal for adding
function openAddModuleModal() {
  // Reset form
  document.getElementById('module-form').reset();
  document.getElementById('edit-module-id').value = '';
  
  // Update UI
  document.getElementById('module-modal-title').textContent = 'Add Module';
  
  // Show modal
  moduleModal.show();
}

// Open module modal for editing
function openEditModuleModal(moduleId) {
  const module = currentCourseModules.find(m => m.id === moduleId);
  if (!module) return;
  
  currentModuleId = moduleId;
  
  // Populate form
  document.getElementById('edit-module-id').value = moduleId;
  document.getElementById('module-title').value = module.title;
  document.getElementById('module-description').value = module.description || '';
  
  // Update UI
  document.getElementById('module-modal-title').textContent = 'Edit Module';
  
  // Show modal
  moduleModal.show();
}

// Save module
async function saveModule() {
  const moduleTitle = document.getElementById('module-title').value;
  const moduleDescription = document.getElementById('module-description').value;
  const moduleId = document.getElementById('edit-module-id').value;
  
  try {
    let moduleData = {
      title: moduleTitle,
      description: moduleDescription,
      updated_at: new Date().toISOString()
    };
    
    if (moduleId) {
      // Update existing module
      const { error } = await supabase
        .from('modules')
        .update(moduleData)
        .eq('id', moduleId);
      
      if (error) throw error;
      
    } else {
      // Create new module
      // Get next order number
      const nextOrder = currentCourseModules.length > 0 
        ? Math.max(...currentCourseModules.map(m => m.order)) + 1 
        : 1;
      
      moduleData.course_id = currentCourseId;
      moduleData.order = nextOrder;
      
      const { error } = await supabase
        .from('modules')
        .insert([moduleData]);
      
      if (error) throw error;
    }
    
    // Close modal and reload modules
    moduleModal.hide();
    loadCourseModules(currentCourseId);
    
  } catch (error) {
    console.error('Error saving module:', error.message);
    showErrorAlert('Error saving module: ' + error.message);
  }
}

// Delete module
async function deleteModule(moduleId) {
  if (!confirm('Are you sure you want to delete this module and all its lessons? This action cannot be undone.')) {
    return;
  }
  
  try {
    const { error } = await supabase
      .from('modules')
      .delete()
      .eq('id', moduleId);
    
    if (error) throw error;
    
    loadCourseModules(currentCourseId);
    
  } catch (error) {
    console.error('Error deleting module:', error.message);
    showErrorAlert('Error deleting module: ' + error.message);
  }
}

// Open lesson modal for adding
function openAddLessonModal(moduleId) {
  // Reset form
  document.getElementById('lesson-form').reset();
  document.getElementById('edit-lesson-id').value = '';
  document.getElementById('lesson-module-id').value = moduleId;
  
  // Reset UI
  document.getElementById('lesson-modal-title').textContent = 'Add Lesson';
  document.getElementById('lesson-content-container').classList.remove('hidden');
  document.getElementById('lesson-video-container').classList.add('hidden');
  document.getElementById('video-preview').classList.add('hidden');
  
  // Show modal
  lessonModal.show();
}

// Open lesson modal for editing
async function openEditLessonModal(lessonId) {
  try {
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single();
    
    if (error) throw error;
    
    currentLessonId = lessonId;
    
    // Populate form
    document.getElementById('edit-lesson-id').value = lessonId;
    document.getElementById('lesson-module-id').value = lesson.module_id;
    document.getElementById('lesson-title').value = lesson.title;
    document.getElementById('lesson-type').value = lesson.type;
    document.getElementById('lesson-content').value = lesson.content || '';
    
    // Update UI
    document.getElementById('lesson-modal-title').textContent = 'Edit Lesson';
    
    // Handle lesson type specific UI
    if (lesson.type === 'video') {
      document.getElementById('lesson-content-container').classList.add('hidden');
      document.getElementById('lesson-video-container').classList.remove('hidden');
      
      if (lesson.video_url) {
        const videoPreview = document.getElementById('video-preview');
        const videoPlayer = document.getElementById('video-preview-player');
        videoPlayer.src = lesson.video_url;
        videoPreview.classList.remove('hidden');
      } else {
        document.getElementById('video-preview').classList.add('hidden');
      }
    } else {
      document.getElementById('lesson-content-container').classList.remove('hidden');
      document.getElementById('lesson-video-container').classList.add('hidden');
    }
    
    // Show modal
    lessonModal.show();
    
  } catch (error) {
    console.error('Error loading lesson:', error.message);
    showErrorAlert('Error loading lesson: ' + error.message);
  }
}

// Save lesson
async function saveLesson() {
  const lessonTitle = document.getElementById('lesson-title').value;
  const lessonType = document.getElementById('lesson-type').value;
  const lessonContent = document.getElementById('lesson-content').value;
  const lessonId = document.getElementById('edit-lesson-id').value;
  const moduleId = document.getElementById('lesson-module-id').value;
  const videoFile = document.getElementById('lesson-video').files[0];
  
  try {
    let lessonData = {
      title: lessonTitle,
      type: lessonType,
      content: lessonType === 'text' ? lessonContent : null,
      updated_at: new Date().toISOString()
    };
    
    let result;
    
    if (lessonId) {
      // Update existing lesson
      const { data, error } = await supabase
        .from('lessons')
        .update(lessonData)
        .eq('id', lessonId)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
      
    } else {
      // Create new lesson
      // Get next order number
      const module = currentCourseModules.find(m => m.id === moduleId);
      const nextOrder = module && module.lessons.length > 0 
        ? Math.max(...module.lessons.map(l => l.order)) + 1 
        : 1;
      
      lessonData.module_id = moduleId;
      lessonData.order = nextOrder;
      
      const { data, error } = await supabase
        .from('lessons')
        .insert([lessonData])
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }
    
    // Handle video upload if selected
    if (lessonType === 'video' && videoFile) {
      const filePath = `courses/${currentCourseId}/modules/${moduleId}/lessons/${result.id}/${Date.now()}_${videoFile.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(filePath, videoFile, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data } = supabase.storage
        .from('course-materials')
        .getPublicUrl(filePath);
      
      // Update lesson with video URL
      const { error: updateError } = await supabase
        .from('lessons')
        .update({ 
          video_url: data.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', result.id);
      
      if (updateError) throw updateError;
    }
    
    // Close modal and reload modules
    lessonModal.hide();
    loadCourseModules(currentCourseId);
    
  } catch (error) {
    console.error('Error saving lesson:', error.message);
    showErrorAlert('Error saving lesson: ' + error.message);
  }
}

// Delete lesson
async function deleteLesson(lessonId) {
  if (!confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
    return;
  }
  
  try {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId);
    
    if (error) throw error;
    
    loadCourseModules(currentCourseId);
    
  } catch (error) {
    console.error('Error deleting lesson:', error.message);
    showErrorAlert('Error deleting lesson: ' + error.message);
  }
}

// UI Helpers
function showCourseEditor() {
  coursesScreen.classList.add('hidden');
  courseEditorScreen.classList.remove('hidden');
}

function showCoursesScreen() {
  coursesScreen.classList.remove('hidden');
  courseEditorScreen.classList.add('hidden');
}

function showSuccessAlert(message) {
  // Implementation depends on your UI framework
  alert(message);
}

function showErrorAlert(message) {
  // Implementation depends on your UI framework
  alert(message);
}

// Add event listeners
function setupCourseListeners() {
  newCourseBtn.addEventListener('click', createNewCourse);
  backToCoursesBtn.addEventListener('click', showCoursesScreen);
  courseDetailsForm.addEventListener('submit', saveCourse);
  deleteCourseBtn.addEventListener('click', deleteCourse);
  addModuleBtn.addEventListener('click', openAddModuleModal);
  saveModuleBtn.addEventListener('click', saveModule);
  saveLessonBtn.addEventListener('click', saveLesson);
  
  // File input preview for course cover image
  document.getElementById('course-cover-image').addEventListener('change', function(e) {
    if (this.files && this.files[0]) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const coverPreview = document.getElementById('cover-image-preview');
        const coverPreviewImg = document.getElementById('cover-preview-img');
        coverPreviewImg.src = e.target.result;
        coverPreview.classList.remove('hidden');
      }
      reader.readAsDataURL(this.files[0]);
    }
  });
  
  // File input preview for video
  document.getElementById('lesson-video').addEventListener('change', function(e) {
    if (this.files && this.files[0]) {
      const file = this.files[0];
      const videoURL = URL.createObjectURL(file);
      const videoPreview = document.getElementById('video-preview');
      const videoPlayer = document.getElementById('video-preview-player');
      videoPlayer.src = videoURL;
      videoPreview.classList.remove('hidden');
    }
  });
}

// Initialize courses functionality
function initCourses() {
  setupCourseListeners();
  initModals();
}
