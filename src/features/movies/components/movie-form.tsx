import type { ComponentProps } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Controller,
  useForm,
  type Control,
  type FieldPath,
} from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  DEFAULT_ACCENT,
  MAX_YEAR,
  MIN_YEAR,
  movieFormSchema,
  type Movie,
  type MovieFormValues,
  type MovieInput,
} from "@/features/movies/schemas"
import { ApiError } from "@/lib/http-client"
import { cn } from "@/lib/utils"

type MovieFormProps = {
  movie?: Movie
  onSubmit: (
    values: MovieInput,
    changes: Partial<MovieInput>
  ) => Promise<unknown>
  onCancel?: () => void
}

const FORM_FIELDS = Object.keys(
  movieFormSchema.shape
) as FieldPath<MovieFormValues>[]

export function MovieForm({ movie, onSubmit, onCancel }: MovieFormProps) {
  const isEditing = movie !== undefined

  const form = useForm<MovieFormValues, unknown, MovieInput>({
    resolver: zodResolver(movieFormSchema),
    defaultValues: toFormValues(movie),
  })
  const { isDirty, dirtyFields, isSubmitting } = form.formState

  async function submit(values: MovieInput) {
    const changes = Object.fromEntries(
      Object.entries(values).filter(
        ([field]) => dirtyFields[field as keyof MovieFormValues]
      )
    ) as Partial<MovieInput>

    try {
      await onSubmit(values, changes)
      if (!isEditing) form.reset()
    } catch (error) {
      showApiFieldErrors(error)
    }
  }

  function showApiFieldErrors(error: unknown) {
    if (!(error instanceof ApiError) || !error.details) return

    for (const field of FORM_FIELDS) {
      const message = error.details[field]?.[0]
      if (message) form.setError(field, { type: "server", message })
    }
  }

  return (
    <form
      noValidate
      aria-label={isEditing ? `Editar ${movie.title}` : "Cadastrar filme"}
      onSubmit={form.handleSubmit(submit)}
      className="flex flex-wrap items-start gap-3"
    >
      <FormInput
        control={form.control}
        name="title"
        label="Título"
        className="min-w-40 flex-1"
      />
      <FormInput
        control={form.control}
        name="genre"
        label="Gênero"
        className="w-36"
      />
      <FormInput
        control={form.control}
        name="year"
        label="Ano"
        className="w-24"
        type="number"
        inputMode="numeric"
        min={MIN_YEAR}
        max={MAX_YEAR}
      />
      <FormInput
        control={form.control}
        name="accent"
        label="Cor"
        className="w-12"
        type="color"
        inputClassName="cursor-pointer p-1"
      />

      <div className="mt-5 flex gap-2">
        <Button
          type="submit"
          disabled={isSubmitting || (isEditing && !isDirty)}
        >
          {submitLabel(isEditing, isSubmitting)}
        </Button>
        {isEditing && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  )
}

type FormInputProps = {
  control: Control<MovieFormValues, unknown, MovieInput>
  name: FieldPath<MovieFormValues>
  label: string
  className?: string
  inputClassName?: string
} & Pick<ComponentProps<"input">, "type" | "inputMode" | "min" | "max">

function FormInput({
  control,
  name,
  label,
  className,
  inputClassName,
  ...inputProps
}: FormInputProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const id = `movie-${name}`
        const errorId = `${id}-error`

        return (
          <Field
            data-invalid={fieldState.invalid}
            className={cn("w-auto", className)}
          >
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <Input
              {...field}
              {...inputProps}
              id={id}
              aria-invalid={fieldState.invalid}
              aria-describedby={fieldState.invalid ? errorId : undefined}
              className={inputClassName}
            />
            {fieldState.invalid && (
              <FieldError id={errorId} errors={[fieldState.error]} />
            )}
          </Field>
        )
      }}
    />
  )
}

function toFormValues(movie?: Movie): MovieFormValues {
  return {
    title: movie?.title ?? "",
    genre: movie?.genre ?? "",
    year: movie ? String(movie.year) : "",
    accent: movie?.accent ?? DEFAULT_ACCENT,
  }
}

function submitLabel(isEditing: boolean, isSubmitting: boolean) {
  if (isSubmitting) return "Salvando…"
  return isEditing ? "Salvar alterações" : "Adicionar"
}
