"use client";
import { ArrowUp, CheckCircle2, ChevronUp, LucideArrowUpNarrowWide } from "lucide-react";
import { TodoPriority } from "@/types/ToDo";
import { Progress } from "@/components/ui/progress";
import Todo from "@/components/Todo";
import { useToast } from "@/components/ui/use-toast";
import { TodoSchema } from "@/schemas/schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import useSWR from "swr";
import Spinner from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PriorityDropDwon } from "@/components/PriorityDropDown";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


const Todos = () => {
  const { toast } = useToast();
  const todos: TypeTodo[] = [];
  const [todo, setTodos] = useState<TypeTodo[]>(todos);
  const [newTodo, setNewTodo] = useState<string>("");
  const [totalDone, setTotalDone] = useState<number>();
  const [todoPriorityInDialog, setTodoPriorityInDialog] = useState<TodoPriority>(TodoPriority.Low);

  const handleTodoPriorityEdit = (priority: TodoPriority) => {
    setTodoPriorityInDialog(priority)
  }


  const fetcher = async (url: string) => {
    try {
      const res = await api.get(url).then((res) => res.data);
      return res;
    } catch (error) {
      console.log(error);
    }
  };

  const { data, error, isLoading, mutate } = useSWR("/todo", fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnReconnect: false,
  });
  // const [isEditing, setIsEditing] = useState<boolean>(false)

  const addTodoForm = useForm<z.infer<typeof TodoSchema>>({
    resolver: zodResolver(TodoSchema),
    defaultValues: {
      todo: "",
      priority: TodoPriority.Low,
    },
  });

  useEffect(() => {
    if (data) {
      console.log(data.data);
      setTodos(data.data.todos);
    }
    const completed = todo.filter(
      (singleTodo) => singleTodo.isCompleted == true
    );
    setTotalDone(completed.length as number);
  }, [data]);

  const handleTodoBehaviour = (id: string) => {
    console.log(id);
    const filteredTodos = todo.map((singleTodo) => {
      if (singleTodo.id == id) {
        // console.log(
        //   "now set to ",
        //   singleTodo.isCompleted === true ? false : true
        // );
        const ToggleResponse = api.put(`/toggleTodo/${singleTodo.id}`, {
          isCompleted: singleTodo.isCompleted === true ? false : true,
        });
        singleTodo.isCompleted = singleTodo.isCompleted === true ? false : true;
        if (singleTodo.isCompleted) {
          const todoCompleteTaostMessage = {
            title:
              totalDone && totalDone < todo.length - 1
                ? `Only ${todo.length - (totalDone as number) - 1
                } left! You got this.`
                : `Done for the day!`,
            description:
              totalDone && totalDone < todo.length - 1
                ? "Kudos on completing your task!"
                : "Sit back and relax!",
          };
          toast(todoCompleteTaostMessage);
        }
      }
      return singleTodo;
    });
    const completed = todo.filter(
      (singleTodo) => singleTodo.isCompleted == true
    );
    setTotalDone(completed.length as number);
    setTodos(filteredTodos);
    // mutate()
  };

  const handleNewTodo = async (data: z.infer<typeof TodoSchema>) => {
    const validatedFields = TodoSchema.safeParse(data);
    if (validatedFields.success) {
      const { todo, priority } = validatedFields.data;
      try {
        const res = await api.post("/todo", {
          todo,
          priority,
        });
        let newTodoTaostMessage = {
          title: `Added to your list.`,
          description: `+ ${newTodo}`,
        };
        toast(newTodoTaostMessage);
      } catch (error: any) {
        console.error("Error creating todo:", error);
      }
    } else {
      return { error: "Invalid Fields" };
    }
    mutate();
    addTodoForm.reset();
  };

  //! @Kanishk created the edit function... need to integrate only
  const handleEditTodo = async (
    todoId: string,
    todo_body: string,
    priority: TodoPriority
  ) => {
    try {
      const response = await api.put(`/todo/${todoId}`, {
        todo: todo_body,
        priority: priority,
      });
      if (response.data.success) {
        const newTodos = todo.map((todo) => {
          if (todo.id === todoId) {
            todo.todo_body = todo_body;
            todo.priority = priority;
          }
          return todo;
        });
        const updateMessage = {
          title: `Updated Your Todo successfully`,
          description: `- ${todo_body}`,
        };
        setTodos(newTodos);
        toast(updateMessage);
      }
    } catch (error) {
      const updateMessageFailed = {
        title: `Failed to Update your Todo`,
        description: `- ${todo_body}`,
      };
      toast(updateMessageFailed);
    }
  };

  const handleDeleteTodo = (delId: string, delTitle: string) => {
    const filteredTodoList = todo.filter(
      (singleTodo) => singleTodo.id !== delId
    );
    const delResponse = api.delete(`/todo/${delId}`);
    console.log(delResponse);
    const delTodoTaostMessage = {
      title: `Removed from your list.`,
      description: `- ${delTitle}`,
    };
    toast(delTodoTaostMessage);
    setTodos(filteredTodoList);
  };

  if (isLoading) {
    return (
      <div className="pt-4 w-full">
        <h5 className="flex justify-center items-center text-center p-3">
          <Spinner />
        </h5>
      </div>
    );
  }
  return (
    <article className="h-[calc(100vh-1rem)] backdrop-blur w-3/5 left-3 border-r border-stone-200 flex flex-col py-4 px-3 justify-start  items-start">
      <div className="flex justify-between">
        <h1 className="text-xl mt-1 text-stone-700 font-bold muted flex items-center justify-center">
          <CheckCircle2 className="inline mr-2" color="green" />
          <span className="text-primary">To-dos</span>
        </h1>
      </div>
      <hr className="w-full my-1" />
      <section className="flex mt-2 flex-col w-full h-[calc(100%-3.5rem)]">
        <div className="flex flex-col">
          <div className="flex   justify-between">
            <h2 className="text-lg font-medium">Todays Tasks</h2>
            <h2 className="text-lg font-bold text-right">
              {totalDone != todo.length
                ? `${totalDone} / ${todo.length}`
                : "Done for the day!"}
            </h2>
          </div>
          <div className="mt-2">
            <Progress
              value={totalDone && (totalDone * 100) / todo.length}
              className="w-full"
            ></Progress>
          </div>
        </div>
        <hr className="w-full mt-4"></hr>
        <div className="flex flex-col justify-between overflow-hidden h-full">
          <div className="transition h-full duration-1000 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-primary scrollbar-track-slate-200 pr-2">
            {todo &&
              todo.map(
                (todo) =>
                  !todo.isCompleted && (
                    <Todo
                      title={todo.todo_body}
                      classname=""
                      priority={todo.priority}
                      id={todo.id}
                      onclick={() => handleTodoBehaviour(todo.id as string)}
                      isDone={todo.isCompleted}
                      onDelete={() =>
                        handleDeleteTodo(
                          todo.id as string,
                          todo.todo_body as string
                        )
                      }
                    />
                  )
              )}
            {totalDone != todo.length && <hr className="w-full mt-4"></hr>}
            {todo &&
              todo.map(
                (todo) =>
                  todo.isCompleted && (
                    <Todo
                      title={todo.todo_body}
                      classname=""
                      priority={todo.priority}
                      id={todo.id}
                      onclick={() => handleTodoBehaviour(todo.id as string)}
                      isDone={todo.isCompleted}
                      onDelete={() =>
                        handleDeleteTodo(
                          todo.id as string,
                          todo.todo_body as string
                        )
                      }
                    />
                  )
              )}
          </div>
          <form
            className="flex flex-row justify-center items-center gap-2 mt-5"
            onSubmit={addTodoForm.handleSubmit(handleNewTodo)}
          >
            <div className="px-6 rounded-full flex py-4 gap-x-2 border border-emerald-700 w-full ">
              <div className="relative flex group items-center justify-center cursor-pointer gap-x-1">
                {/* <span>Priority: </span> */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <PriorityDropDwon
                        priority={todoPriorityInDialog}
                        onPriorityChange={handleTodoPriorityEdit}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Set Your Todo Priority.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

              </div>
              <div className="h-8 my-auto w-px mx-1 bg-gray-300"></div>
              <input
                {...addTodoForm.register("todo")}
                id="todo"
                type="text"
                className="focus:outline-none w-full"
                placeholder="Enter new task..."
              />
            </div>

            <button
              type="submit"
              className="py-4 px-4 rounded-full border border-emerald-700 hover:bg-emerald-400"
            >
              <ArrowUp strokeWidth={3} />
            </button>
          </form>
        </div>
      </section>
    </article>
  );
};

export default Todos;
