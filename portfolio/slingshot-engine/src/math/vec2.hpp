#ifndef SLINGSHOT_MATH_VEC2_HPP
#define SLINGSHOT_MATH_VEC2_HPP

#include <cmath>

namespace slingshot
{

    struct Vec2
    {
        float x = 0.0f;
        float y = 0.0f;

        constexpr Vec2() = default;
        constexpr Vec2(float x_, float y_) : x(x_), y(y_) {}

        // Arithmetic operators
        constexpr Vec2 operator+(const Vec2 &other) const
        {
            return Vec2(x + other.x, y + other.y);
        }

        constexpr Vec2 operator-(const Vec2 &other) const
        {
            return Vec2(x - other.x, y - other.y);
        }

        constexpr Vec2 operator*(float scalar) const
        {
            return Vec2(x * scalar, y * scalar);
        }

        constexpr Vec2 operator/(float scalar) const
        {
            return Vec2(x / scalar, y / scalar);
        }

        // Compound assignment
        Vec2 &operator+=(const Vec2 &other)
        {
            x += other.x;
            y += other.y;
            return *this;
        }

        Vec2 &operator-=(const Vec2 &other)
        {
            x -= other.x;
            y -= other.y;
            return *this;
        }

        Vec2 &operator*=(float scalar)
        {
            x *= scalar;
            y *= scalar;
            return *this;
        }

        // Unary minus
        constexpr Vec2 operator-() const
        {
            return Vec2(-x, -y);
        }

        // Magnitude
        float magnitude() const
        {
            return std::sqrt(x * x + y * y);
        }

        float magnitudeSquared() const
        {
            return x * x + y * y;
        }

        // Normalized vector (returns zero vector if magnitude is 0)
        Vec2 normalized() const
        {
            float mag = magnitude();
            if (mag < 1e-8f)
                return Vec2(0, 0);
            return *this / mag;
        }

        // Distance to another point
        float distanceTo(const Vec2 &other) const
        {
            return (*this - other).magnitude();
        }

        float distanceSquaredTo(const Vec2 &other) const
        {
            return (*this - other).magnitudeSquared();
        }

        // Dot product
        constexpr float dot(const Vec2 &other) const
        {
            return x * other.x + y * other.y;
        }

        // Perpendicular vector (90 degrees counterclockwise)
        constexpr Vec2 perpendicular() const
        {
            return Vec2(-y, x);
        }

        // Rotate by angle (radians)
        Vec2 rotated(float angle) const
        {
            float c = std::cos(angle);
            float s = std::sin(angle);
            return Vec2(x * c - y * s, x * s + y * c);
        }

        // Lerp
        static Vec2 lerp(const Vec2 &a, const Vec2 &b, float t)
        {
            return a + (b - a) * t;
        }
    };

    // Scalar * Vec2
    constexpr Vec2 operator*(float scalar, const Vec2 &v)
    {
        return v * scalar;
    }

} // namespace slingshot

#endif
