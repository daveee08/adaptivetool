import { NextRequest, NextResponse } from 'next/server'

interface EducationClass {
  id: string
  displayName: string
  description?: string
  studentCount?: number
  students?: Student[]
}

interface Student {
  id: string
  displayName: string
  primaryRole: string
  email?: string
}

interface Assignment {
  id: string
  displayName: string
  instructions?: string
  dueDateTime?: { dateTime: string } | null
  status?: string
}

export async function POST(request: NextRequest) {
  try {
    const { access_token } = await request.json()
    
    if (!access_token) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 })
    }

    const results = {
      classes: [] as EducationClass[],
      assignments: [] as Assignment[],
      students: [] as Student[],
      totalStudents: 0,
      summary: {
        totalClasses: 0,
        totalAssignments: 0,
        totalStudents: 0,
        userRole: 'unknown'
      }
    }

    try {
      // 1. Get user education profile to check role
      const meResponse = await fetch('https://graph.microsoft.com/v1.0/education/me', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (meResponse.ok) {
        const meData = await meResponse.json()
        results.summary.userRole = meData.primaryRole || 'unknown'
        console.log('User role:', results.summary.userRole)
      }

      // 2. Get all education classes
      const classesResponse = await fetch('https://graph.microsoft.com/v1.0/education/me/classes', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (classesResponse.ok) {
        const classesData = await classesResponse.json()
        results.classes = classesData.value || []
        results.summary.totalClasses = results.classes.length
        console.log(`Found ${results.classes.length} classes`)

        // 3. For each class, get student members
        for (const eduClass of results.classes) {
          try {
            const membersResponse = await fetch(`https://graph.microsoft.com/v1.0/education/classes/${eduClass.id}/members`, {
              headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json',
              },
            })

            if (membersResponse.ok) {
              const membersData = await membersResponse.json()
              const students = membersData.value?.filter((member: Student) => 
                member.primaryRole === 'student'
              ) || []
              
              eduClass.studentCount = students.length
              eduClass.students = students
              results.students.push(...students)
            }
          } catch (memberError) {
            console.error(`Error fetching members for class ${eduClass.id}:`, memberError)
            eduClass.studentCount = 0
            eduClass.students = []
          }
        }

        // Remove duplicates and count total unique students
        const uniqueStudents = results.students.filter((student, index, self) => 
          index === self.findIndex(s => s.id === student.id)
        )
        results.students = uniqueStudents
        results.totalStudents = uniqueStudents.length
        results.summary.totalStudents = uniqueStudents.length
      }

      // 4. Get all assignments
      const assignmentsResponse = await fetch('https://graph.microsoft.com/v1.0/education/me/assignments', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json()
        results.assignments = assignmentsData.value || []
        results.summary.totalAssignments = results.assignments.length
        console.log(`Found ${results.assignments.length} assignments`)
      }

    } catch (apiError) {
      console.error('Education API error:', apiError)
      return NextResponse.json({ 
        error: 'Failed to fetch education data',
        details: apiError instanceof Error ? apiError.message : 'Unknown error',
        results: results
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data: results,
      message: `Found ${results.summary.totalClasses} classes, ${results.summary.totalAssignments} assignments, and ${results.summary.totalStudents} students`
    })

  } catch (error) {
    console.error('Error in education endpoint:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch education data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
