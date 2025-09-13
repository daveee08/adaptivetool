"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Cell, Label, Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart"

interface Team {
  id: string
  displayName: string
  description?: string
}

interface EducationClass {
  id: string
  displayName: string
  studentCount?: number
}

interface TeamMember {
  id: string
  displayName?: string
  userPrincipalName: string
  '@odata.type'?: string
}

interface ChartDataItem {
  category: string
  displayName: string
  students: number
  fill: string
}

const assignmentsData = [
  { type: "completed", count: 145, fill: "#1e40af" },
  { type: "pending", count: 89, fill: "#3b82f6" },
  { type: "overdue", count: 32, fill: "#60a5fa" },
  { type: "draft", count: 54, fill: "#93c5fd" },
]

const assignmentsConfig = {
  count: {
    label: "Assignments",
  },
  completed: {
    label: "Completed",
    color: "#1e40af",
  },
  pending: {
    label: "Pending",
    color: "#3b82f6",
  },
  overdue: {
    label: "Overdue",
    color: "#60a5fa",
  },
  draft: {
    label: "Draft",
    color: "#93c5fd",
  },
} satisfies ChartConfig

const performanceData = [
  { grade: "A", students: 85, fill: "#1e3a8a" },
  { grade: "B", students: 120, fill: "#1e40af" },
  { grade: "C", students: 95, fill: "#3b82f6" },
  { grade: "D", students: 45, fill: "#60a5fa" },
  { grade: "F", students: 15, fill: "#bfdbfe" },
]

const performanceConfig = {
  students: {
    label: "Students",
  },
  a: {
    label: "A Grade",
    color: "#1e3a8a",
  },
  b: {
    label: "B Grade",
    color: "#1e40af",
  },
  c: {
    label: "C Grade",
    color: "#3b82f6",
  },
  d: {
    label: "D Grade",
    color: "#60a5fa",
  },
  f: {
    label: "F Grade",
    color: "#bfdbfe",
  },
} satisfies ChartConfig

export function ClassesChart() {
  const [teamsData, setTeamsData] = React.useState<ChartDataItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchEducationData = async () => {
      const fallbackData: ChartDataItem[] = [
        { category: 'math', displayName: 'MATH', students: 1, fill: '#1e3a8a' },
        { category: 'vex_iq_student_side', displayName: 'VEX IQ STUDENT SIDE', students: 1, fill: '#1e40af' },
        { category: 'science', displayName: 'SCIENCE', students: 1, fill: '#3b82f6' }
      ]
      
      try {
        const token = localStorage.getItem('access_token')
        if (!token) {
          setTeamsData(fallbackData)
          setLoading(false)
          return
        }
        const educationResponse = await fetch('/api/education', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ access_token: token }),
        })

        if (educationResponse.ok) {
          const educationData = await educationResponse.json()
          
          if (educationData.success && educationData.data.classes.length > 0) {
            const hasRealStudentCounts = educationData.data.classes.some((eduClass: EducationClass) => 
              eduClass.studentCount && eduClass.studentCount > 0
            )
            
            if (hasRealStudentCounts) {
              const blueShades = ["#1e3a8a", "#1e40af", "#3b82f6", "#60a5fa", "#93c5fd"]
              const chartData: ChartDataItem[] = educationData.data.classes.map((eduClass: EducationClass, index: number) => ({
                category: eduClass.displayName.toLowerCase().replace(/\s+/g, '_'),
                displayName: eduClass.displayName,
                students: eduClass.studentCount || 0,
                fill: blueShades[index % blueShades.length],
              }))

              setTeamsData(chartData)
              setLoading(false)
              return
            }
          }
        }

        const teamsResponse = await fetch('/api/teams', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ access_token: token }),
        })

        if (!teamsResponse.ok) {
          throw new Error('Failed to fetch teams')
        }

        const teamsData = await teamsResponse.json()
        
        if (!teamsData.value || teamsData.value.length === 0) {
          setTeamsData([])
          setLoading(false)
          return
        }

        const blueShades = ["#1e3a8a", "#1e40af", "#3b82f6", "#60a5fa", "#93c5fd"]
        
        // Track unique students across all teams
        const allUniqueStudents = new Set<string>()
        const teamStudentData: { [teamName: string]: TeamMember[] } = {}
        
        // First pass: collect all unique students
        const chartDataPromises = teamsData.value.map(async (team: Team, index: number) => {
          try {
            const membersResponse = await fetch('https://graph.microsoft.com/v1.0/groups/' + team.id + '/members', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            })
            
            const ownersResponse = await fetch('https://graph.microsoft.com/v1.0/groups/' + team.id + '/owners', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            })

            let students: TeamMember[] = []
            
            if (membersResponse.ok && ownersResponse.ok) {
              const membersData = await membersResponse.json()
              const ownersData = await ownersResponse.json()
              
              // Get all members and owners
              const allMembers = membersData.value || []
              const allOwners = ownersData.value || []
              
              // Filter out owners to get students with member role only
              students = allMembers.filter((member: TeamMember) => 
                !allOwners.some((owner: TeamMember) => owner.id === member.id)
              )
              
              // Add students to unique set and team data
              students.forEach(student => {
                allUniqueStudents.add(student.id || student.userPrincipalName)
              })
              teamStudentData[team.displayName] = students
            }

            return {
              category: team.displayName.toLowerCase().replace(/\s+/g, '_'),
              displayName: team.displayName,
              students: students.length, // Use actual student count
              fill: blueShades[index % blueShades.length],
            }
          } catch {
            // Fallback data for errors
            return {
              category: team.displayName.toLowerCase().replace(/\s+/g, '_'),
              displayName: team.displayName,
              students: 0,
              fill: blueShades[index % blueShades.length],
            }
          }
        })

        const chartData: ChartDataItem[] = await Promise.all(chartDataPromises)
        
        // Calculate unique student information
        const totalEnrollments = chartData.reduce((sum, team) => sum + team.students, 0)
        const uniqueStudentCount = allUniqueStudents.size
        
        // Adjust chart data to reflect unique student distribution
        const adjustedChartData = chartData.map(team => {
          // Calculate what portion of unique students this team represents
          const proportion = team.students / totalEnrollments
          const adjustedStudents = Math.round(proportion * uniqueStudentCount)
          
          return {
            ...team,
            students: adjustedStudents
          }
        })
        
        // Ensure the total adds up to exactly the unique count
        const adjustedTotal = adjustedChartData.reduce((sum, team) => sum + team.students, 0)
        if (adjustedTotal !== uniqueStudentCount) {
          const difference = uniqueStudentCount - adjustedTotal
          // Add the difference to the largest team
          const largestTeamIndex = adjustedChartData.findIndex(team => 
            team.students === Math.max(...adjustedChartData.map(t => t.students))
          )
          if (largestTeamIndex >= 0) {
            adjustedChartData[largestTeamIndex].students += difference
          }
        }
        
        setTeamsData(adjustedChartData.length > 0 ? adjustedChartData : [])
      } catch (err) {
        console.error('Error fetching teams data:', err)
        setTeamsData([])
        setError(null)
      } finally {
        setLoading(false)
      }
    }

    fetchEducationData()
  }, [])

  const classesConfig = React.useMemo(() => {
    const config: ChartConfig = {
      students: {
        label: "Students",
      },
    }

    const blueShades = ["#1e3a8a", "#1e40af", "#3b82f6", "#60a5fa", "#93c5fd"]
    
    teamsData.forEach((team, index) => {
      config[team.category] = {
        label: team.displayName,
        color: blueShades[index % blueShades.length],
      }
    })

    return config
  }, [teamsData])

  const totalStudents = React.useMemo(() => {
    return teamsData.reduce((acc, curr) => acc + curr.students, 0)
  }, [teamsData])

  if (loading) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Classes</CardTitle>
          <CardDescription>Loading teams...</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0 flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Classes</CardTitle>
          <CardDescription>Error loading teams</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0 flex items-center justify-center">
          <div className="text-destructive text-sm">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (teamsData.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Classes</CardTitle>
          <CardDescription>No teams found</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0 flex items-center justify-center">
          <div className="text-muted-foreground">No teams available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Classes</CardTitle>
        <CardDescription>Unique students across teams</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={classesConfig}
          className="mx-auto aspect-square max-h-[250px] min-h-[200px]"
        >
          <PieChart width={250} height={250}>
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="rounded-lg border bg-background px-4 py-3 text-sm shadow-md min-w-[150px]">
                      <div className="font-medium mb-2">{data.displayName}</div>
                      <div className="text-muted-foreground">
                        {data.students} students
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Pie
              data={teamsData}
              dataKey="students"
              nameKey="displayName"
              innerRadius={60}
              outerRadius={100}
              strokeWidth={2}
            >
              {teamsData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalStudents.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Students
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Hover on the Colors <TrendingUp className="h-4 w-4" />
        </div>
      </CardFooter>
    </Card>
  )
}

export function AssignmentsChart() {
  const totalAssignments = React.useMemo(() => {
    return assignmentsData.reduce((acc, curr) => acc + curr.count, 0)
  }, [])

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Assignments</CardTitle>
        <CardDescription>Status Overview</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={assignmentsConfig}
          className="mx-auto aspect-square max-h-[250px] min-h-[200px]"
        >
          <PieChart width={250} height={250}>
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="rounded-lg border bg-background px-4 py-3 text-sm shadow-md min-w-[140px]">
                      <div className="font-medium mb-2 capitalize">{data.type}</div>
                      <div className="text-muted-foreground">
                        {data.count} assignments
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Pie
              data={assignmentsData}
              dataKey="count"
              nameKey="type"
              innerRadius={60}
              outerRadius={100}
              strokeWidth={2}
            >
              {assignmentsData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalAssignments.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Total
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Hover on the Colors <TrendingUp className="h-4 w-4" />
        </div>
      </CardFooter>
    </Card>
  )
}

export function PerformanceChart() {
  const totalStudents = React.useMemo(() => {
    return performanceData.reduce((acc, curr) => acc + curr.students, 0)
  }, [])

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Performance</CardTitle>
        <CardDescription>Grade Distribution</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={performanceConfig}
          className="mx-auto aspect-square max-h-[250px] min-h-[200px]"
        >
          <PieChart width={250} height={250}>
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="rounded-lg border bg-background px-4 py-3 text-sm shadow-md min-w-[120px]">
                      <div className="font-medium mb-2">Grade {data.grade}</div>
                      <div className="text-muted-foreground">
                        {data.students} students
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Pie
              data={performanceData}
              dataKey="students"
              nameKey="grade"
              innerRadius={60}
              outerRadius={100}
              strokeWidth={2}
            >
              {performanceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalStudents.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Students
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Hover on the Colors <TrendingUp className="h-4 w-4" />
        </div>
      </CardFooter>
    </Card>
  )
}
