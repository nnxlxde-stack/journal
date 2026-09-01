// =========================================================
// Типы базы данных Supabase.
// Ручная генерация по supabase/migrations/20260901000000_init.sql.
// После миграций перегенерировать командой:
//   npx supabase gen types typescript --project-id <project-ref> > lib/types/database.types.ts
// =========================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      semesters: {
        Row: {
          id: string;
          name: string;
          year: number;
          term: 1 | 2;
          start_date: string;
          end_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          year: number;
          term: 1 | 2;
          start_date: string;
          end_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          year?: number;
          term?: 1 | 2;
          start_date?: string;
          end_date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      disciplines: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      teachers: {
        Row: {
          id: string;
          full_name: string;
          user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          user_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teachers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      students: {
        Row: {
          id: string;
          full_name: string;
          group_id: string;
          user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          group_id: string;
          user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          group_id?: string;
          user_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "students_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "students_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      lessons: {
        Row: {
          id: string;
          semester_id: string;
          discipline_id: string;
          group_id: string;
          teacher_id: string | null;
          lesson_date: string;
          pair_number: number;
          lesson_type: Database["public"]["Enums"]["lesson_type"];
          created_at: string;
        };
        Insert: {
          id?: string;
          semester_id: string;
          discipline_id: string;
          group_id: string;
          teacher_id?: string | null;
          lesson_date: string;
          pair_number: number;
          lesson_type?: Database["public"]["Enums"]["lesson_type"];
          created_at?: string;
        };
        Update: {
          id?: string;
          semester_id?: string;
          discipline_id?: string;
          group_id?: string;
          teacher_id?: string | null;
          lesson_date?: string;
          pair_number?: number;
          lesson_type?: Database["public"]["Enums"]["lesson_type"];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lessons_semester_id_fkey";
            columns: ["semester_id"];
            isOneToOne: false;
            referencedRelation: "semesters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lessons_discipline_id_fkey";
            columns: ["discipline_id"];
            isOneToOne: false;
            referencedRelation: "disciplines";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lessons_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lessons_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "teachers";
            referencedColumns: ["id"];
          },
        ];
      };
      attendance: {
        Row: {
          id: string;
          lesson_id: string;
          student_id: string;
          status: Database["public"]["Enums"]["attendance_status"];
          marked_by: string | null;
          marked_at: string;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          student_id: string;
          status?: Database["public"]["Enums"]["attendance_status"];
          marked_by?: string | null;
          marked_at?: string;
        };
        Update: {
          id?: string;
          lesson_id?: string;
          student_id?: string;
          status?: Database["public"]["Enums"]["attendance_status"];
          marked_by?: string | null;
          marked_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_marked_by_fkey";
            columns: ["marked_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      attendance_journal: {
        Row: {
          attendance_id: string | null;
          semester: string | null;
          lesson_date: string | null;
          pair_number: number | null;
          lesson_type: Database["public"]["Enums"]["lesson_type"] | null;
          discipline: string | null;
          group_name: string | null;
          student_name: string | null;
          status: Database["public"]["Enums"]["attendance_status"] | null;
          teacher_name: string | null;
          marked_at: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      attendance_status: "present" | "absent_unknown" | "late" | "sick";
      lesson_type: "lecture" | "practice" | "lab" | "exam" | "credit";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never;
