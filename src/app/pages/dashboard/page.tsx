"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { CircleCheckIcon, CircleHelpIcon, CircleIcon } from "lucide-react"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { ClassesChart, AssignmentsChart, PerformanceChart } from "@/components/chart-pie-donut"

interface Team {
  id: string
  displayName: string
  description?: string
}

interface Assignment {
  id: string
  title: string
  dueDateTime?: string
  status: 'upcoming' | 'ready-to-grade' | 'past-due' | 'returned' | 'drafts'
  teamName: string
  description?: string
}

export default function NavigationMenuDemo() {
  const [teams, setTeams] = useState<Team[]>([])
  const [teamsLoading, setTeamsLoading] = useState(false)
  const [quizzes, setQuizzes] = useState<Assignment[]>([])
  const [assignmentsLoading, setAssignmentsLoading] = useState(false)

  const fetchTeams = async () => {
    const accessToken = localStorage.getItem('access_token')
    if (!accessToken) return

    setTeamsLoading(true)
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken })
      })
      const data = await response.json()
      if (data.value) {
        setTeams(data.value)
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    } finally {
      setTeamsLoading(false)
    }
  }

  const fetchAssignments = async () => {
    const accessToken = localStorage.getItem('access_token')
    if (!accessToken) return

    setAssignmentsLoading(true)
    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken })
      })
      const data = await response.json()
      
      if (data.quizzes) {
        console.log('Received quizzes data:', data.quizzes)
        console.log('Debug info:', data.debug)
        console.log('Past due assignments:', data.quizzes.filter((q: Assignment) => q.status === 'past-due'))
        console.log('Returned assignments:', data.quizzes.filter((q: Assignment) => q.status === 'returned'))
        setQuizzes(data.quizzes)
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
    } finally {
      setAssignmentsLoading(false)
    }
  }

  useEffect(() => {
    fetchTeams()
    fetchAssignments()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Menu */}
      <div className="flex justify-center pt-4 relative z-50">
        <NavigationMenu viewport={false}>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Teams</NavigationMenuTrigger>
              <NavigationMenuContent className="z-50">
                <ul className="grid w-[400px] gap-2 max-h-[400px] overflow-y-auto p-2">
                  {teamsLoading ? (
                    <li className="p-4 text-center text-muted-foreground">
                      Loading teams...
                    </li>
                  ) : teams.length === 0 ? (
                    <li className="p-4 text-center text-muted-foreground">
                      No teams found. Please login first.
                    </li>
                  ) : (
                    teams.map((team) => (
                      <li key={team.id}>
                        <NavigationMenuLink asChild>
                          <Link href={`#`} className="block p-2 rounded hover:bg-muted">
                            <div className="font-medium">{team.displayName}</div>
                            {team.description && (
                              <div className="text-muted-foreground text-sm line-clamp-2 mt-1">
                                {team.description}
                              </div>
                            )}
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))
                  )}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Assignments/Quizzes</NavigationMenuTrigger>
              <NavigationMenuContent className="z-50">
                <div className="w-[400px] p-4">
                  <hr className="border-border mb-3" />
                  {assignmentsLoading ? (
                    <div className="p-4 text-left text-muted-foreground text-sm">
                      Loading quizzes...
                    </div>
                  ) : quizzes.length === 0 ? (
                    <div className="p-4 text-left text-muted-foreground text-sm">
                      No quizzes found
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Ready to Grade */}
                      {quizzes.filter(quiz => quiz.status === 'ready-to-grade').length > 0 && (
                        <div>
                          <h4 className="font-medium text-xs text-muted-foreground mb-2 uppercase tracking-wider">Ready to Grade</h4>
                          <ul className="space-y-1">
                            {quizzes
                              .filter(quiz => quiz.status === 'ready-to-grade')
                              .sort((a, b) => {
                                if (!a.dueDateTime || !b.dueDateTime) return 0;
                                return new Date(b.dueDateTime).getTime() - new Date(a.dueDateTime).getTime();
                              })
                              .map((quiz) => (
                              <li key={quiz.id}>
                                <NavigationMenuLink asChild>
                                  <Link href="#" className="flex items-left justify-between p-2 rounded hover:bg-muted">
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">{quiz.title}</div>
                                      <div className="text-muted-foreground text-xs">
                                        {quiz.teamName}
                                        {quiz.dueDateTime && (
                                          <span> • Due: {new Date(quiz.dueDateTime).toLocaleDateString()}</span>
                                        )}
                                      </div>
                                    </div>
                                  </Link>
                                </NavigationMenuLink>
                              </li>
                            ))}
                          </ul>
                          {quizzes.filter(quiz => quiz.status === 'returned').length > 0 && (
                            <hr className="border-border mt-3" />
                          )}
                        </div>
                      )}

                      {/* Returned (Graded) */}
                      {quizzes.filter(quiz => quiz.status === 'returned').length > 0 && (
                        <div>
                          <h4 className="font-medium text-xs text-muted-foreground mb-2 uppercase tracking-wider">Graded</h4>
                          <ul className="space-y-1">
                            {quizzes
                              .filter(quiz => quiz.status === 'returned')
                              .sort((a, b) => {
                                if (!a.dueDateTime || !b.dueDateTime) return 0;
                                return new Date(b.dueDateTime).getTime() - new Date(a.dueDateTime).getTime();
                              })
                              .map((quiz) => (
                              <li key={quiz.id}>
                                <NavigationMenuLink asChild>
                                  <Link href="#" className="flex items-left justify-between p-2 rounded hover:bg-muted">
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">{quiz.title}</div>
                                      <div className="text-muted-foreground text-xs">
                                        {quiz.teamName}
                                        {quiz.dueDateTime && (
                                          <span> • Due: {new Date(quiz.dueDateTime).toLocaleDateString()}</span>
                                        )}
                                      </div>
                                    </div>
                                  </Link>
                                </NavigationMenuLink>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Show message if no assignments in either category */}
                      {quizzes.filter(quiz => quiz.status === 'ready-to-grade' || quiz.status === 'returned').length === 0 && (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                          No assignments ready to grade or graded assignments found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link href="/docs">Docs</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>List</NavigationMenuTrigger>
              <NavigationMenuContent className="z-50">
                <ul className="grid w-[300px] gap-4 p-4">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link href="#" className="block">
                        <div className="font-medium">Components</div>
                        <div className="text-muted-foreground text-sm">
                          Browse all components in the library.
                        </div>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link href="#" className="block">
                        <div className="font-medium">Documentation</div>
                        <div className="text-muted-foreground text-sm">
                          Learn how to use the library.
                        </div>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link href="#" className="block">
                        <div className="font-medium">Blog</div>
                        <div className="text-muted-foreground text-sm">
                          Read our latest blog posts.
                        </div>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Simple</NavigationMenuTrigger>
              <NavigationMenuContent className="z-50">
                <ul className="grid w-[200px] gap-4 p-4">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link href="#">Components</Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link href="#">Documentation</Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link href="#">Blocks</Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>With Icon</NavigationMenuTrigger>
              <NavigationMenuContent className="z-50">
                <ul className="grid w-[200px] gap-4 p-4">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link href="#" className="flex items-center gap-2">
                        <CircleHelpIcon className="w-4 h-4" />
                        Backlog
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link href="#" className="flex items-center gap-2">
                        <CircleIcon className="w-4 h-4" />
                        To Do
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link href="#" className="flex items-center gap-2">
                        <CircleCheckIcon className="w-4 h-4" />
                        Done
                      </Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Charts Section */}
      <div className="flex justify-center items-center mt-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl">
          <div className="w-full max-w-md">
            <ClassesChart />
          </div>
          <div className="w-full max-w-md">
            <AssignmentsChart />
          </div>
          <div className="w-full max-w-md">
            <PerformanceChart />
          </div>
        </div>
      </div>
    </div>
  )
}