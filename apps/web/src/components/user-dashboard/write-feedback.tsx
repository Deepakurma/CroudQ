'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { Star } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { getPublicErrorMessage } from '~/lib/trpc-error';
import { Button } from '~/shared/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '~/shared/shadcn/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '~/shared/shadcn/form';
import { Textarea } from '~/shared/shadcn/textarea';

import { trpcClient } from '~/utils/trpc';

const feedbackFormSchema = z.object({
  description: z.string().optional(),
  rating: z.number().min(1, 'Please select a rating')
});

type feedbackFormValues = z.infer<typeof feedbackFormSchema>;

type WriteFeedbackProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function WriteFeedback({ isOpen, onClose }: WriteFeedbackProps) {
  const form = useForm<feedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      rating: 0
    }
  });

  const onFormSubmit = async (values: feedbackFormValues) => {
    try {
      await trpcClient.admin.submitFeedback.mutate({
        rating: values.rating,
        description: values.description
      });
      toast.success('Thanks for your feedback!');
      form.reset();
      onClose();
    } catch (error) {
      toast.error(getPublicErrorMessage(error, 'Could not submit feedback right now.'));
    }
  };
  const [hover, setHover] = useState<number | null>(null);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="flex w-full flex-col items-center gap-1 text-center">
          <DialogTitle className="text-2xl font-bold">Write Us</DialogTitle>
          <DialogDescription className="max-w-lg text-sm">
            Feel free to share your feedback. It helps us a lot!
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="e.g. Love your services"
                      className="text-sm"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Star Rating */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <FormControl>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }, (_, i) => {
                        const starIndex = i + 1;
                        return (
                          <Star
                            key={i}
                            onClick={() => field.onChange(starIndex)} // actually set value
                            onMouseEnter={() => setHover(starIndex)} // temporary hover preview
                            onMouseLeave={() => setHover(null)} // reset hover
                            className={clsx(
                              'cursor-pointer transition-colors duration-150',
                              starIndex <= (hover ?? field.value)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground'
                            )}
                            size={28}
                          />
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Submit
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
