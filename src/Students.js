// src/Students.js

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
  // State to store the current logged-in user's UID
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    if (session && session.user) {
      setCurrentUserId(session.user.id);
    }
  }, [session]);

  // Fetch classes for dropdowns
  useEffect(() => {
    const fetchClasses = async () => {
      const { data, error } = await supabase.from('classes').select('id, name, teacher_id'); // Select teacher_id too
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

  // Helper function to determine if the logged-in user is the teacher for a given student's class
  const isTeacherOfClass = (studentClassId) => {
    if (!currentUserId) return false;
    const studentClass = classes.find(cls => cls.id === studentClassId);
    return studentClass && studentClass.teacher_id === currentUserId;
  };

  // Group students by class_id for separate display
  const groupedStudents = students.reduce((acc, student) => {
    const classId = student.class_id;
    if (!acc[classId]) {
      acc[classId] = [];
    }
    acc[classId].push(student);
    return acc;
  }, {});


  // Basic inline styles for the students list and forms
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px',
      backgroundColor: '#f0f2f5', /* Changed background color to a lighter grey */
      minHeight: '100vh',
      fontFamily: 'Inter, Arial, sans-serif', /* Preferred font, with fallback */
      color: '#333',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        maxWidth: '700px', /* Increased max-width for better layout */
        marginBottom: '30px',
        padding: '10px 0',
    },
    heading: {
      color: '#2c3e50', /* Darker, more professional heading color */
      margin: 0,
      fontSize: '2.2em',
      fontWeight: '600',
    },
    message: {
      color: '#28a745', /* Success message color */
      backgroundColor: '#d4edda',
      border: '1px solid #c3e6cb',
      borderRadius: '8px',
      padding: '12px 20px',
      marginTop: '15px',
      marginBottom: '20px',
      textAlign: 'center',
      width: '100%',
      maxWidth: '600px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
    },
    errorMessage: {
      color: '#dc3545', /* Error message color */
      backgroundColor: '#f8d7da',
      border: '1px solid #f5c6cb',
      borderRadius: '8px',
      padding: '12px 20px',
      marginTop: '15px',
      marginBottom: '20px',
      textAlign: 'center',
      width: '100%',
      maxWidth: '600px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
    },
    loadingText: {
      color: '#555',
      fontSize: '1.2em',
      marginTop: '20px',
    },
    formContainer: {
      backgroundColor: '#ffffff',
      border: '1px solid #e0e0e0',
      borderRadius: '12px', /* More rounded corners */
      padding: '30px',
      marginBottom: '30px',
      boxShadow: '0 6px 15px rgba(0,0,0,0.1)', /* Enhanced shadow */
      width: '100%',
      maxWidth: '600px', /* Increased max-width */
    },
    formTitle: {
      fontSize: '1.8em',
      marginBottom: '20px',
      color: '#34495e', /* Darker title color */
      textAlign: 'center',
      fontWeight: 'bold',
    },
    formGroup: {
      marginBottom: '20px',
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '600', /* Slightly bolder label */
      color: '#444',
      fontSize: '1.05em',
    },
    input: {
      width: 'calc(100% - 24px)', /* Adjusted for padding */
      padding: '12px',
      border: '1px solid #c0c0c0', /* Lighter border */
      borderRadius: '8px',
      fontSize: '1em',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      '&:focus': {
        borderColor: '#007bff',
        boxShadow: '0 0 0 3px rgba(0,123,255,0.25)',
        outline: 'none',
      },
    },
    select: {
      width: '100%',
      padding: '12px',
      border: '1px solid #c0c0c0',
      borderRadius: '8px',
      fontSize: '1em',
      backgroundColor: '#fff',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      '&:focus': {
        borderColor: '#007bff',
        boxShadow: '0 0 0 3px rgba(0,123,255,0.25)',
        outline: 'none',
      },
    },
    button: {
      padding: '12px 25px', /* Larger padding */
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '1.05em',
      fontWeight: '600',
      transition: 'background-color 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease',
      marginRight: '10px',
      boxShadow: '0 4px 8px rgba(0,123,255,0.2)', /* Button shadow */
      '&:hover': {
        backgroundColor: '#0056b3',
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 12px rgba(0,123,255,0.3)',
      },
      '&:active': {
        transform: 'translateY(0)',
        boxShadow: '0 2px 4px rgba(0,123,255,0.2)',
      },
      '&:disabled': {
        backgroundColor: '#cccccc',
        cursor: 'not-allowed',
        boxShadow: 'none',
        transform: 'none',
      },
    },
    logoutButton: {
        backgroundColor: '#6c757d',
        boxShadow: '0 4px 8px rgba(108,117,125,0.2)',
        '&:hover': {
            backgroundColor: '#5a6268',
            boxShadow: '0 6px 12px rgba(108,117,125,0.3)',
        },
        '&:active': {
            boxShadow: '0 2px 4px rgba(108,117,125,0.2)',
        },
    },
    deleteButton: {
      backgroundColor: '#dc3545',
      boxShadow: '0 4px 8px rgba(220,53,69,0.2)',
      '&:hover': {
          backgroundColor: '#c82333',
          boxShadow: '0 6px 12px rgba(220,53,69,0.3)',
      },
      '&:active': {
          boxShadow: '0 2px 4px rgba(220,53,69,0.2)',
      },
    },
    cancelButton: {
      backgroundColor: '#6c757d',
      boxShadow: '0 4px 8px rgba(108,117,125,0.2)',
      '&:hover': {
          backgroundColor: '#5a6268',
          boxShadow: '0 6px 12px rgba(108,117,125,0.3)',
      },
      '&:active': {
          boxShadow: '0 2px 4px rgba(108,117,125,0.2)',
      },
    },
    studentList: {
      listStyleType: 'none',
      padding: 0,
      width: '100%',
      maxWidth: '700px', /* Increased max-width */
    },
    classSection: {
      backgroundColor: '#e9ecef', /* Light grey background for class sections */
      borderRadius: '12px',
      padding: '25px',
      marginBottom: '30px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.07)',
      width: '100%',
    },
    classTitle: {
      fontSize: '1.6em',
      color: '#34495e',
      marginBottom: '20px',
      fontWeight: 'bold',
      borderBottom: '2px solid #ced4da', /* Separator */
      paddingBottom: '10px',
    },
    studentItem: {
      backgroundColor: '#ffffff',
      border: '1px solid #e0e0e0',
      borderRadius: '10px', /* Slightly more rounded student items */
      padding: '18px',
      marginBottom: '15px', /* More spacing between students */
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 4px 8px rgba(0,0,0,0.08)', /* Enhanced shadow for student items */
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
      },
    },
    studentInfo: {
      flexGrow: 1,
      marginBottom: '15px', /* More spacing between info and buttons */
    },
    studentActions: {
      display: 'flex',
      gap: '12px', /* More gap between buttons */
      justifyContent: 'flex-end',
      width: '100%',
    },
    studentName: {
      fontWeight: 'bold',
      color: '#2c3e50',
      fontSize: '1.2em',
      marginBottom: '5px',
    },
    studentDetails: {
      color: '#555',
      fontSize: '0.95em',
      lineHeight: '1.5',
    },
    // Styles for the confirmation modal
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)', /* Darker overlay */
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: '#fff',
      padding: '35px',
      borderRadius: '15px', /* More rounded modal */
      boxShadow: '0 10px 30px rgba(0,0,0,0.4)', /* Deeper shadow */
      textAlign: 'center',
      width: '350px',
      maxWidth: '90%',
      color: '#333',
    },
    modalButtonContainer: {
      marginTop: '25px',
      display: 'flex',
      justifyContent: 'space-around',
      gap: '15px',
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

      {/* Student List Display Grouped by Class */}
      {loading && students.length === 0 ? (
        <p style={styles.loadingText}>Loading students...</p>
      ) : (
        <>
          {Object.keys(groupedStudents).length === 0 ? (
            <p>No students found or you don't have permission to view them.</p>
          ) : (
            Object.keys(groupedStudents).map(classId => {
              const className = classes.find(cls => cls.id === classId)?.name || 'Unknown Class';
              return (
                <div key={classId} style={styles.classSection}>
                  <h3 style={styles.classTitle}>Class: {className}</h3>
                  <ul style={styles.studentList}>
                    {groupedStudents[classId].map((student) => (
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
                              <div style={styles.studentDetails}>Email: {student.email}</div>
                            </div>
                            {/* Conditionally render Edit/Delete buttons */}
                            {isTeacherOfClass(student.class_id) && (
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
                            )}
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
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