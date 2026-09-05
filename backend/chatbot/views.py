from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from google import genai
import os
import json

from .models import User, Conversation, Message, Document, Feedback



def users_list(request):
    users = User.objects.all()

    data = []

    for user in users:
        data.append({
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
        })

    return JsonResponse(data, safe=False)


@csrf_exempt
def signup(request):
    if request.method != "POST":
        return JsonResponse(
            {"error": "Only POST method is allowed"},
            status=405
        )

    try:
        data = json.loads(request.body)

        name = data.get("name")
        email = data.get("email")
        password = data.get("password")

        if not name or not email or not password:
            return JsonResponse(
                {"error": "Name, email and password are required"},
                status=400
            )

        if User.objects.filter(email=email).exists():
            return JsonResponse(
                {"error": "Email already registered"},
                status=400
            )

        now = timezone.now()

        user = User.objects.create(
            name=name,
            email=email,
            password_hash=make_password(password),
            role="USER",
            is_active=True,
            created_at=now,
            updated_at=now
        )

        return JsonResponse(
            {
                "message": "Signup successful",
                "user": {
                    "user_id": user.user_id,
                    "name": user.name,
                    "email": user.email,
                    "role": user.role
                }
            },
            status=201
        )

    except json.JSONDecodeError:
        return JsonResponse(
            {"error": "Invalid JSON"},
            status=400
        )

    except Exception as e:
        return JsonResponse(
            {"error": str(e)},
            status=500
        )
    
@csrf_exempt
def login(request):
    if request.method != 'POST':
        return JsonResponse(
            {"error": "Only POST method is allowed"},
            status=405
        )

    try:
        data = json.loads(request.body)

        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return JsonResponse(
                {"error": "Email and password are required"},
                status=400
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse(
                {"error": "Invalid email or password"},
                status=401
            )

        if not check_password(password, user.password_hash):
            return JsonResponse(
                {"error": "Invalid email or password"},
                status=401
            )

        if not user.is_active:
            return JsonResponse(
                {"error": "User account is inactive"},
                status=403
            )

        return JsonResponse({
            "message": "Login successful",
            "user": {
                "user_id": user.user_id,
                "name": user.name,
                "email": user.email,
                "role": user.role
            }
        })

    except json.JSONDecodeError:
        return JsonResponse(
            {"error": "Invalid JSON"},
            status=400
        )

    except Exception as e:
        return JsonResponse(
            {"error": str(e)},
            status=500
        )

@csrf_exempt
def conversations(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)

            user_id = data.get("user_id")
            title = data.get("title", "New Conversation")

            if not user_id:
                return JsonResponse(
                    {"error": "user_id is required"},
                    status=400
                )

            try:
                user = User.objects.get(user_id=user_id)
            except User.DoesNotExist:
                return JsonResponse(
                    {"error": "User not found"},
                    status=404
                )

            conversation = Conversation.objects.create(
                user=user,
                title=title
            )

            return JsonResponse({
                "message": "Conversation created successfully",
                "conversation": {
                    "conversation_id": conversation.conversation_id,
                    "user_id": user.user_id,
                    "title": conversation.title,
                    "status": conversation.status
                }
            }, status=201)

        except json.JSONDecodeError:
            return JsonResponse(
                {"error": "Invalid JSON"},
                status=400
            )

        except Exception as e:
            return JsonResponse(
                {"error": str(e)},
                status=500
            )

    elif request.method == 'GET':
        user_id = request.GET.get("user_id")

        if not user_id:
            return JsonResponse(
                {"error": "user_id is required"},
                status=400
            )

        conversations_list = Conversation.objects.filter(
            user_id=user_id
        ).order_by('-updated_at')

        data = []

        for conversation in conversations_list:
            data.append({
                "conversation_id": conversation.conversation_id,
                "title": conversation.title,
                "description": conversation.description,
                "status": conversation.status,
                "created_at": conversation.created_at,
                "updated_at": conversation.updated_at,
                "last_message_at": conversation.last_message_at
            })

        return JsonResponse(data, safe=False)

    return JsonResponse(
        {"error": "Method not allowed"},
        status=405
    )


@csrf_exempt
def rename_conversation(request, conversation_id):
    if request.method != 'PUT':
        return JsonResponse(
            {"error": "Only PUT method is allowed"},
            status=405
        )

    try:
        data = json.loads(request.body)
        title = data.get("title")

        if not title:
            return JsonResponse(
                {"error": "title is required"},
                status=400
            )

        try:
            conversation = Conversation.objects.get(
                conversation_id=conversation_id
            )
        except Conversation.DoesNotExist:
            return JsonResponse(
                {"error": "Conversation not found"},
                status=404
            )

        conversation.title = title
        conversation.save(update_fields=["title"])

        return JsonResponse({
            "message": "Conversation renamed successfully",
            "conversation": {
                "conversation_id": conversation.conversation_id,
                "title": conversation.title
            }
        })

    except json.JSONDecodeError:
        return JsonResponse(
            {"error": "Invalid JSON"},
            status=400
        )

    except Exception as e:
        return JsonResponse(
            {"error": str(e)},
            status=500
        )


@csrf_exempt
def delete_conversation(request, conversation_id):
    if request.method != 'DELETE':
        return JsonResponse(
            {"error": "Only DELETE method is allowed"},
            status=405
        )

    try:
        try:
            conversation = Conversation.objects.get(
                conversation_id=conversation_id
            )
        except Conversation.DoesNotExist:
            return JsonResponse(
                {"error": "Conversation not found"},
                status=404
            )

        conversation.delete()

        return JsonResponse({
            "message": "Conversation deleted successfully"
        })

    except Exception as e:
        return JsonResponse(
            {"error": str(e)},
            status=500
        )

@csrf_exempt
def messages(request):
    if request.method == "POST":
        data = json.loads(request.body)

        conversation_id = data.get("conversation_id")
        sender_type = data.get("sender_type")
        message_text = data.get("message_text")

        if not conversation_id or not sender_type or not message_text:
            return JsonResponse(
                {"error": "conversation_id, sender_type and message_text are required"},
                status=400
            )

        try:
            conversation = Conversation.objects.get(
                conversation_id=conversation_id
            )
        except Conversation.DoesNotExist:
            return JsonResponse(
                {"error": "Conversation not found"},
                status=404
            )

        message = Message.objects.create(
            conversation=conversation,
            sender_type=sender_type,
            message_text=message_text
        )

        return JsonResponse(
            {
                "message": "Message created successfully",
                "message_id": message.message_id,
                "conversation_id": conversation.conversation_id,
                "sender_type": message.sender_type,
                "message_text": message.message_text
            },
            status=201
        )

    elif request.method == "GET":
        conversation_id = request.GET.get("conversation_id")

        if not conversation_id:
            return JsonResponse(
                {"error": "conversation_id is required"},
                status=400
            )

        messages_list = Message.objects.filter(
            conversation_id=conversation_id
        ).order_by("created_at")

        data = []

        for message in messages_list:
            data.append(
                {
                    "message_id": message.message_id,
                    "conversation_id": message.conversation_id,
                    "sender_type": message.sender_type,
                    "message_text": message.message_text,
                    "created_at": message.created_at
                }
            )

        return JsonResponse(data, safe=False)

    return JsonResponse(
        {"error": "Only GET and POST methods are allowed"},
        status=405
    )

@csrf_exempt
def chat(request):
    if request.method != "POST":
        return JsonResponse(
            {"error": "Only POST method is allowed"},
            status=405
        )

    try:
        data = json.loads(request.body)

        conversation_id = data.get("conversation_id")
        message_text = data.get("message_text")

        if not conversation_id or not message_text:
            return JsonResponse(
                {"error": "conversation_id and message_text are required"},
                status=400
            )

        # Check whether the conversation exists
        try:
            conversation = Conversation.objects.get(
                conversation_id=conversation_id
            )
        except Conversation.DoesNotExist:
            return JsonResponse(
                {"error": "Conversation not found"},
                status=404
            )

        # Save the user's message in MySQL
        user_message = Message.objects.create(
            conversation=conversation,
            sender_type="USER",
            message_text=message_text
        )

        # Get Gemini API key from .env
        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            return JsonResponse(
                {"error": "Gemini API key is not configured"},
                status=500
            )

        # Create Gemini client
        client = genai.Client(api_key=api_key)

        # Send the user's message to Gemini
        response = client.models.generate_content(
            model="gemini-3.7-flash",
            contents=message_text
        )

        ai_response = response.text

        # Save Gemini's response in MySQL
        ai_message = Message.objects.create(
            conversation=conversation,
            sender_type="AI",
            message_text=ai_response
        )

        return JsonResponse({
            "message": "Chat response generated successfully",
            "conversation_id": conversation.conversation_id,
            "user_message": {
                "message_id": user_message.message_id,
                "sender_type": user_message.sender_type,
                "message_text": user_message.message_text
            },
            "ai_message": {
                "message_id": ai_message.message_id,
                "sender_type": ai_message.sender_type,
                "message_text": ai_message.message_text
            }
        }, status=200)

    except json.JSONDecodeError:
        return JsonResponse(
            {"error": "Invalid JSON"},
            status=400
        )

    except Exception as e:
        return JsonResponse(
            {"error": str(e)},
            status=500
        )