import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient.js'; // Import the Supabase client

const Students = ({ session }) => {
  // State to store the list of students
  const [students, setStudents] = useState([]);
  // State to manage loading status
  const [loading, setLoading] = useState(true);
  // State for displaying messages to the user
  const [message, setMessage] = useState('');
  // State for new student form
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentClassId, setNewStudentClassId] = useState('');
  // State for editing student
  const [editingStudent, setEditingStudent] = useState(null);
  const [editedStudentName, setEditedStudentName] = useState('');
  const [editedStudentEmail, setEditedStudentEmail] = useState('');
  const [editedStudentClassId, setEditedStudentClassId] = useState('');
  // State to store classes for dropdowns
  const [classes, setClasses] = useState([]);
  // State for confirmation dialog
  const [showConfirm, setShowConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  // Fetch classes for dropdowns
  useEffect(() => {
    const fetchClasses = async () => {
      const { data, error } = await supabase.from('classes').select('id, name');
      if (error) {
        console.error('Error fetching classes:', error.message);
      } else {
        setClasses(data);
        // Set default new student class if classes exist
        if (data.length > 0) {
          setNewStudentClassId(data[0].id);
        }
      }
    };
    fetchClasses();
  }, []);

  // useEffect to fetch students when the component mounts, session changes, or data is modified
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      setMessage('');

      // Fetch all students from the 'students' table
      const { data, error } = await supabase
        .from('students')
        .select('*'); // Select all columns

      if (error) {
        console.error('Error fetching students:', error.message);
        setMessage(`Error fetching students: ${error.message}`);
      } else {
        setStudents(data);
        setMessage(`Loaded ${data.length} students.`);
      }
      setLoading(false);
    };

    if (session) { // Only fetch students if a user is logged in
      fetchStudents();
    }
  }, [session]); // Re-fetch students when session changes (login/logout)

  // Function to handle adding a new student
  const handleAddStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Get the current user's ID to set as created_by
    const { data: { user } } = await supabase.auth.getUser();
    const createdBy = user ? user.id : null;

    if (!newStudentName || !newStudentEmail || !newStudentClassId) {
      setMessage('Please fill in all fields for the new student.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('students')
      .insert([
        {
          name: newStudentName,
          email: newStudentEmail,
          class_id: newStudentClassId,
          created_by: createdBy, // Set the creator's ID
        },
      ])
      .select(); // Select the inserted row to get its ID

    if (error) {
      setMessage(`Error adding student: ${error.message}`);
      console.error('Error adding student:', error);
    } else {
      setStudents([...students, data[0]]); // Add the new student to the list
      setNewStudentName('');
      setNewStudentEmail('');
      // Keep newStudentClassId as is for quick consecutive additions to same class
      setMessage(`Student '${data[0].name}' added successfully!`);
    }
    setLoading(false);
  };

  // Function to handle editing a student
  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setEditedStudentName(student.name);
    setEditedStudentEmail(student.email);
    setEditedStudentClassId(student.class_id);
    setMessage(''); // Clear any previous messages
  };

  // Function to save edited student
  const handleSaveEditedStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!editedStudentName || !editedStudentEmail || !editedStudentClassId) {
      setMessage('Please fill in all fields for the edited student.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('students')
      .update({
        name: editedStudentName,
        email: editedStudentEmail,
        class_id: editedStudentClassId,
      })
      .eq('id', editingStudent.id) // Match the student by ID
      .select(); // Return the updated row

    if (error) {
      setMessage(`Error updating student: ${error.message}`);
      console.error('Error updating student:', error);
    } else {
      setStudents(
        students.map((student) =>
          student.id === editingStudent.id ? data[0] : student
        )
      ); // Update the student in the list
      setEditingStudent(null); // Exit editing mode
      setMessage(`Student '${data[0].name}' updated successfully!`);
    }
    setLoading(false);
  };

  // Function to handle deleting a student (shows confirmation)
  const handleDeleteStudentConfirm = (student) => {
    setStudentToDelete(student);
    setShowConfirm(true);
  };

  // Function to perform the actual deletion
  const handleDeleteStudent = async () => {
    setLoading(true);
    setMessage('');
    setShowConfirm(false); // Hide confirmation dialog

    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentToDelete.id); // Match the student by ID

    if (error) {
      setMessage(`Error deleting student: ${error.message}`);
      console.error('Error deleting student:', error);
    } else {
      setStudents(students.filter((student) => student.id !== studentToDelete.id)); // Remove from list
      setMessage(`Student '${studentToDelete.name}' deleted successfully!`);
      setStudentToDelete(null); // Clear student to delete
    }
    setLoading(false);
  };

  // Function to handle user logout
  const handleLogout = async () => {
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage(`Error logging out: ${error.message}`);
      console.error('Logout error:', error.message);
    } else {
      // Supabase's onAuthStateChange in App.js will handle redirecting to Auth component
      setMessage('Successfully logged out.');
    }
    setLoading(false);
  };

  // Basic inline styles for the students list and forms
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px',
      backgroundColor: '#f9f9f9',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        maxWidth: '600px',
        marginBottom: '20px',
    },
    heading: {
      color: '#333',
      margin: 0, // Remove default margin for alignment
    },
    message: {
      color: '#007bff',
      marginTop: '10px',
      marginBottom: '10px',
      textAlign: 'center',
    },
    errorMessage: {
      color: '#d9534f',
      marginTop: '10px',
      marginBottom: '10px',
      textAlign: 'center',
    },
    loadingText: {
      color: '#555',
      fontSize: '1.2em',
    },
    formContainer: {
      backgroundColor: '#ffffff',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
      width: '100%',
      maxWidth: '500px',
    },
    formTitle: {
      fontSize: '1.5em',
      marginBottom: '15px',
      color: '#333',
      textAlign: 'center',
    },
    formGroup: {
      marginBottom: '15px',
    },
    label: {
      display: 'block',
      marginBottom: '5px',
      fontWeight: 'bold',
      color: '#555',
    },
    input: {
      width: 'calc(100% - 22px)', // Account for padding and border
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '5px',
      fontSize: '1em',
    },
    select: {
      width: '100%',
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '5px',
      fontSize: '1em',
      backgroundColor: '#fff',
    },
    button: {
      padding: '10px 15px',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '1em',
      transition: 'background-color 0.3s ease',
      marginRight: '10px', // For spacing between buttons
    },
    logoutButton: {
        backgroundColor: '#6c757d', // A neutral grey for logout
        marginLeft: 'auto', // Push to the right
    },
    deleteButton: {
      backgroundColor: '#dc3545',
    },
    cancelButton: {
      backgroundColor: '#6c757d',
    },
    buttonHover: {
      backgroundColor: '#0056b3',
    },
    deleteButtonHover: {
      backgroundColor: '#c82333',
    },
    cancelButtonHover: {
      backgroundColor: '#5a6268',
    },
    logoutButtonHover: {
        backgroundColor: '#5a6268',
    },
    studentList: {
      listStyleType: 'none',
      padding: 0,
      width: '100%',
      maxWidth: '600px',
    },
    studentItem: {
      backgroundColor: '#ffffff',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '10px',
      display: 'flex',
      flexDirection: 'column', // Changed to column for better stacking on small screens
      boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
    },
    studentInfo: {
      flexGrow: 1,
      marginBottom: '10px', // Add spacing between info and buttons
    },
    studentActions: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'flex-end', // Align buttons to the right
      width: '100%',
    },
    studentName: {
      fontWeight: 'bold',
      color: '#333',
      fontSize: '1.1em',
    },
    studentDetails: {
      color: '#666',
      fontSize: '0.9em',
    },
    // Styles for the confirmation modal
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: '#fff',
      padding: '30px',
      borderRadius: '10px',
      boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
      textAlign: 'center',
      width: '300px',
      maxWidth: '90%',
    },
    modalButtonContainer: {
      marginTop: '20px',
      display: 'flex',
      justifyContent: 'space-around',
      gap: '10px',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.heading}>Student List</h2>
        <button
            onClick={handleLogout}
            style={{ ...styles.button, ...styles.logoutButton }}
            disabled={loading}
        >
            Log Out
        </button>
      </div>
      {message && <p style={message.includes('Error') ? styles.errorMessage : styles.message}>{message}</p>}

      {/* Add New Student Form */}
      <div style={styles.formContainer}>
        <h3 style={styles.formTitle}>Add New Student</h3>
        <form onSubmit={handleAddStudent}>
          <div style={styles.formGroup}>
            <label htmlFor="newStudentName" style={styles.label}>Name:</label>
            <input
              id="newStudentName"
              type="text"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="newStudentEmail" style={styles.label}>Email:</label>
            <input
              id="newStudentEmail"
              type="email"
              value={newStudentEmail}
              onChange={(e) => setNewStudentEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="newStudentClass" style={styles.label}>Class:</label>
            <select
              id="newStudentClass"
              value={newStudentClassId}
              onChange={(e) => setNewStudentClassId(e.target.value)}
              style={styles.select}
              required
            >
              {classes.length > 0 ? (
                classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))
              ) : (
                <option value="">Loading classes...</option>
              )}
            </select>
          </div>
          <button type="submit" style={styles.button} disabled={loading}>
            Add Student
          </button>
        </form>
      </div>

      {/* Student List Display */}
      {loading && students.length === 0 ? (
        <p style={styles.loadingText}>Loading students...</p>
      ) : (
        <>
          {students.length === 0 ? (
            <p>No students found or you don't have permission to view them.</p>
          ) : (
            <ul style={styles.studentList}>
              {students.map((student) => (
                <li key={student.id} style={styles.studentItem}>
                  {editingStudent && editingStudent.id === student.id ? (
                    // Edit Form for the selected student
                    <form onSubmit={handleSaveEditedStudent} style={{ width: '100%' }}>
                      <h4 style={{ marginBottom: '10px', color: '#333' }}>Edit Student</h4>
                      <div style={styles.formGroup}>
                        <label htmlFor={`editName-${student.id}`} style={styles.label}>Name:</label>
                        <input
                          id={`editName-${student.id}`}
                          type="text"
                          value={editedStudentName}
                          onChange={(e) => setEditedStudentName(e.target.value)}
                          style={styles.input}
                          required
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label htmlFor={`editEmail-${student.id}`} style={styles.label}>Email:</label>
                        <input
                          id={`editEmail-${student.id}`}
                          type="email"
                          value={editedStudentEmail}
                          onChange={(e) => setEditedStudentEmail(e.target.value)}
                          style={styles.input}
                          required
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label htmlFor={`editClass-${student.id}`} style={styles.label}>Class:</label>
                        <select
                          id={`editClass-${student.id}`}
                          value={editedStudentClassId}
                          onChange={(e) => setEditedStudentClassId(e.target.value)}
                          style={styles.select}
                          required
                        >
                          {classes.length > 0 ? (
                            classes.map((cls) => (
                              <option key={cls.id} value={cls.id}>
                                {cls.name}
                              </option>
                            ))
                          ) : (
                            <option value="">Loading classes...</option>
                          )}
                        </select>
                      </div>
                      <div style={styles.studentActions}>
                        <button type="submit" style={styles.button} disabled={loading}>Save</button>
                        <button
                          type="button"
                          onClick={() => setEditingStudent(null)}
                          style={{ ...styles.button, ...styles.cancelButton }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    // Display student info
                    <>
                      <div style={styles.studentInfo}>
                        <div style={styles.studentName}>{student.name}</div>
                        <div style={styles.studentDetails}>Class: {classes.find(cls => cls.id === student.class_id)?.name || 'N/A'}</div>
                        <div style={styles.studentDetails}>Email: {student.email}</div>
                      </div>
                      <div style={styles.studentActions}>
                        <button onClick={() => handleEditStudent(student)} style={styles.button}>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteStudentConfirm(student)}
                          style={{ ...styles.button, ...styles.deleteButton }}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* Confirmation Modal for Delete */}
      {showConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete student "{studentToDelete?.name}"?</p>
            <div style={styles.modalButtonContainer}>
              <button
                onClick={handleDeleteStudent}
                style={{ ...styles.button, ...styles.deleteButton }}
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                style={{ ...styles.button, ...styles.cancelButton }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;